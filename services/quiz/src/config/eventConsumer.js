import { createConnection } from "./redis.js";
import { readPositiveIntegerEnv } from "../utils/env.js";
import logger, { serializeError } from "../utils/logger.js";

// Redis Streams consumer group on a DEDICATED connection so the blocking XREADGROUP never
// stalls the shared client used by request-path checks. Entries are acked ONLY after the
// handler succeeds; failures stay pending, get reclaimed via XAUTOCLAIM, and are dead-lettered
// after MAX_ATTEMPTS. Handlers must be idempotent because redelivery is expected. Groups start
// at "0" so events already in the stream at first bootstrap are not skipped.

const READ_COUNT = 10;
const IDLE_BACKOFF_MS = 1000;
const RECLAIM_COUNT = 20;
const DEADLETTER_MAXLEN = 10000;

// Defaults suit production; tests shorten them so a retry does not take a minute.
const BLOCK_MS = readPositiveIntegerEnv("CONSUMER_BLOCK_MS", 5000);
const RECLAIM_MIN_IDLE_MS = readPositiveIntegerEnv("CONSUMER_RECLAIM_IDLE_MS", 60000);
const RECLAIM_INTERVAL_MS = readPositiveIntegerEnv("CONSUMER_RECLAIM_INTERVAL_MS", 30000);
const MAX_ATTEMPTS = readPositiveIntegerEnv("CONSUMER_MAX_ATTEMPTS", 5);
const DEADLETTER_STREAM = process.env.CONSUMER_DEADLETTER_STREAM || "events:deadletter";

function fieldsToObject(fields) {
  const message = {};
  for (let index = 0; index < fields.length; index += 2) {
    message[fields[index]] = fields[index + 1];
  }
  return message;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startStreamConsumer({ stream, group, consumer, handler }) {
  let running = true;
  let groupReady = false;
  let lastReclaimAt = 0;
  const conn = createConnection();

  if (!conn) {
    logger.info("consumer.disabled", { stream, group });
    return { async stop() {} };
  }

  conn.on("error", (error) => {
    logger.warn("consumer.redis_error", { stream, ...serializeError(error) });
  });

  async function ensureGroup() {
    if (groupReady) {
      return;
    }
    try {
      // "0" (not "$") so a freshly created group still replays events already in the stream.
      await conn.xgroup("CREATE", stream, group, "0", "MKSTREAM");
    } catch (error) {
      if (!String(error?.message || "").includes("BUSYGROUP")) {
        throw error;
      }
    }
    groupReady = true;
  }

  async function ack(id) {
    await conn.xack(stream, group, id).catch((error) =>
      logger.warn("consumer.ack_failed", { stream, group, id, ...serializeError(error) }),
    );
  }

  // Acks only on success; a thrown handler leaves the entry pending for later reclaim.
  async function runHandler(id, fields) {
    try {
      await handler(fieldsToObject(fields));
    } catch (error) {
      logger.error("consumer.handler_failed", { stream, group, id, ...serializeError(error) });
      return;
    }
    await ack(id);
  }

  async function deadLetter(id, fields, attempts) {
    const message = fieldsToObject(fields);
    try {
      await conn.xadd(
        DEADLETTER_STREAM, "MAXLEN", "~", DEADLETTER_MAXLEN, "*",
        "type", message.type ?? "unknown",
        "payload", message.payload ?? "{}",
        "originalStream", stream,
        "originalId", id,
        "group", group,
        "attempts", String(attempts),
        "ts", String(Date.now()),
      );
    } catch (error) {
      logger.error("consumer.dead_letter_failed", { stream, group, id, ...serializeError(error) });
      return;
    }
    logger.error("consumer.dead_lettered", { stream, group, id, attempts });
    await ack(id);
  }

  async function reclaimEntry(id, priorDeliveries) {
    const claimed = await conn.xclaim(stream, group, consumer, RECLAIM_MIN_IDLE_MS, id);
    if (!claimed || claimed.length === 0) {
      return;
    }
    const [, fields] = claimed[0];
    if (!fields) {
      await ack(id);
      return;
    }
    if (priorDeliveries >= MAX_ATTEMPTS) {
      await deadLetter(id, fields, priorDeliveries);
      return;
    }
    await runHandler(id, fields);
  }

  async function reclaimStale() {
    const pending = await conn.xpending(
      stream, group, "IDLE", RECLAIM_MIN_IDLE_MS, "-", "+", RECLAIM_COUNT,
    );
    for (const entry of pending ?? []) {
      const [id, , , deliveries] = entry;
      await reclaimEntry(id, Number(deliveries));
    }
  }

  async function maybeReclaim() {
    const now = Date.now();
    if (now - lastReclaimAt < RECLAIM_INTERVAL_MS) {
      return;
    }
    lastReclaimAt = now;
    await reclaimStale();
  }

  async function readBatch() {
    await ensureGroup();
    const response = await conn.xreadgroup(
      "GROUP", group, consumer, "COUNT", READ_COUNT, "BLOCK", BLOCK_MS, "STREAMS", stream, ">",
    );
    if (!response) {
      return;
    }
    for (const [, entries] of response) {
      for (const [id, fields] of entries) {
        await runHandler(id, fields);
      }
    }
  }

  async function loop() {
    await conn.connect().catch((error) =>
      logger.warn("consumer.connect_failed", { stream, ...serializeError(error) }),
    );
    while (running) {
      if (conn.status !== "ready") {
        await sleep(IDLE_BACKOFF_MS);
        continue;
      }
      try {
        await readBatch();
        await maybeReclaim();
      } catch (error) {
        groupReady = false;
        logger.warn("consumer.read_failed", { stream, group, ...serializeError(error) });
        await sleep(IDLE_BACKOFF_MS);
      }
    }
  }

  const finished = loop();
  logger.info("consumer.started", { stream, group, consumer });

  return {
    async stop() {
      running = false;
      await finished;
      try {
        await conn.quit();
      } catch {
        conn.disconnect();
      }
    },
  };
}
