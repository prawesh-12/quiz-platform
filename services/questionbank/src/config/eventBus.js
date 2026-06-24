import { getRedis, isRedisReady } from "./redis.js";
import { readPositiveIntegerEnv } from "../utils/env.js";
import logger, { serializeError } from "../utils/logger.js";

// Best-effort event bus over Redis Streams; no Redis is a silent no-op. All questionbank
// events land on a single stream so downstream services consume one place.

const QUESTIONBANK_STREAM = "events:questionbank";

export const EVENTS = Object.freeze({
  SUBJECT_UPSERTED: "subject.upserted",
  SUBJECT_DELETED: "subject.deleted",
});

const STREAM_MAXLEN = readPositiveIntegerEnv("EVENT_STREAM_MAXLEN", 10000);

// All questionbank events share one stream; the outbox stores it per row for relay/debugging.
export function resolveStream() {
  return QUESTIONBANK_STREAM;
}

// Returns the stream entry id on success, or false when nothing was published.
export async function publishEvent(type, payload = {}) {
  const redis = getRedis();
  if (!redis || !isRedisReady()) {
    return false;
  }

  try {
    const id = await redis.xadd(
      QUESTIONBANK_STREAM,
      "MAXLEN",
      "~",
      STREAM_MAXLEN,
      "*",
      "type",
      type,
      "payload",
      JSON.stringify(payload),
      "ts",
      String(Date.now()),
    );
    return id;
  } catch (error) {
    logger.warn("event.publish_failed", { type, ...serializeError(error) });
    return false;
  }
}
