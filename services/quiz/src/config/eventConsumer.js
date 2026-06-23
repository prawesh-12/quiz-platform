import { getRedis, isRedisReady } from "./redis.js";
import logger, { serializeError } from "../utils/logger.js";

// Redis Streams consumer group. Failed handlers are logged and still acked (the producer
// re-emits), so handlers must be idempotent.

const READ_COUNT = 10;
const BLOCK_MS = 5000;
const IDLE_BACKOFF_MS = 1000;

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

  async function ensureGroup(redis) {
    if (groupReady) {
      return;
    }
    try {
      await redis.xgroup("CREATE", stream, group, "$", "MKSTREAM");
    } catch (error) {
      if (!String(error?.message || "").includes("BUSYGROUP")) {
        throw error;
      }
    }
    groupReady = true;
  }

  async function dispatch(redis, id, fields) {
    try {
      await handler(fieldsToObject(fields));
    } catch (error) {
      logger.error("consumer.handler_failed", { stream, id, ...serializeError(error) });
    } finally {
      await redis.xack(stream, group, id).catch((error) =>
        logger.warn("consumer.ack_failed", { stream, id, ...serializeError(error) }),
      );
    }
  }

  async function loop() {
    while (running) {
      const redis = getRedis();
      if (!redis || !isRedisReady()) {
        await sleep(IDLE_BACKOFF_MS);
        continue;
      }

      try {
        await ensureGroup(redis);
        const response = await redis.xreadgroup(
          "GROUP", group, consumer, "COUNT", READ_COUNT, "BLOCK", BLOCK_MS, "STREAMS", stream, ">",
        );
        if (!response) {
          continue;
        }
        for (const [, entries] of response) {
          for (const [id, fields] of entries) {
            await dispatch(redis, id, fields);
          }
        }
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
    },
  };
}
