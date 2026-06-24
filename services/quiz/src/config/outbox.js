import pool from "./db.js";
import { publishEvent, resolveStream } from "./eventBus.js";
import logger, { serializeError } from "../utils/logger.js";

// Transactional outbox. enqueueOutboxEvent writes the event in the caller's tx so it commits
// atomically with the domain change; the relay then publishes pending rows to Redis with
// backoff, so a broker outage or a crash after commit can never drop an event.

const RELAY_INTERVAL_MS = Number(process.env.OUTBOX_RELAY_INTERVAL_MS || 1000);
const RELAY_BATCH = Number(process.env.OUTBOX_RELAY_BATCH || 50);
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 60000;

export async function enqueueOutboxEvent(client, type, payload = {}) {
  await client.query(
    "INSERT INTO outbox_events (stream, type, payload) VALUES ($1, $2, $3)",
    [resolveStream(type), type, JSON.stringify(payload)],
  );
}

function backoffSeconds(attempts) {
  return Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempts) / 1000;
}

async function publishRow(client, row) {
  const streamId = await publishEvent(row.type, row.payload);
  if (streamId) {
    await client.query(
      "UPDATE outbox_events SET status = 'published', published_at = NOW() WHERE id = $1",
      [row.id],
    );
    return;
  }
  await client.query(
    `UPDATE outbox_events
        SET attempts = attempts + 1,
            next_attempt_at = NOW() + make_interval(secs => $2),
            last_error = 'publish_failed'
      WHERE id = $1`,
    [row.id, backoffSeconds(row.attempts)],
  );
}

// Locks a batch of due rows (SKIP LOCKED so relays never collide) and publishes each.
// Returns the row count so the caller can loop fast while a backlog drains.
async function drainOnce() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT id, type, payload, attempts FROM outbox_events
        WHERE status = 'pending' AND next_attempt_at <= NOW()
        ORDER BY id ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED`,
      [RELAY_BATCH],
    );
    for (const row of rows) {
      await publishRow(client, row);
    }
    await client.query("COMMIT");
    return rows.length;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    logger.warn("outbox.drain_failed", serializeError(error));
    return 0;
  } finally {
    client.release();
  }
}

export function startOutboxRelay() {
  let running = true;
  let timer = null;

  async function tick() {
    if (!running) {
      return;
    }
    const drained = await drainOnce();
    timer = setTimeout(tick, drained >= RELAY_BATCH ? 0 : RELAY_INTERVAL_MS);
    timer.unref?.();
  }

  tick();
  logger.info("outbox.relay_started", {});

  return {
    async stop() {
      running = false;
      if (timer) {
        clearTimeout(timer);
      }
    },
  };
}
