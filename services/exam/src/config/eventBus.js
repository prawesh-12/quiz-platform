import { getRedis, isRedisReady } from "./redis.js";
import { readPositiveIntegerEnv } from "../utils/env.js";
import logger, { serializeError } from "../utils/logger.js";

// Best-effort event bus over Redis Streams; no Redis is a silent no-op. Stream is keyed by
// the event's domain prefix (e.g. session.submitted -> events:session).

export const EVENTS = Object.freeze({
  SESSION_STARTED: "session.started",
  SESSION_SUBMITTED: "session.submitted",
  VIOLATION_FLAGGED: "violation.flagged",
});

const STREAM_MAXLEN = readPositiveIntegerEnv("EVENT_STREAM_MAXLEN", 10000);

function streamFor(type) {
  return `events:${String(type).split(".")[0]}`;
}

// Returns the stream entry id on success, or false when nothing was published.
export async function publishEvent(type, payload = {}) {
  const redis = getRedis();
  if (!redis || !isRedisReady()) {
    return false;
  }

  try {
    const id = await redis.xadd(
      streamFor(type),
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
