import { getRedis, isRedisReady } from "./redis.js";
import { readPositiveIntegerEnv } from "../utils/env.js";
import logger, { serializeError } from "../utils/logger.js";

// Domain event bus over Redis Streams. Producers publish here; for now nothing consumes
// — services attach consumer groups once they are extracted. Best-effort: no Redis (or
// Redis down) is a silent no-op so a publish can never break the request path. Stream is
// chosen from the event's domain prefix (e.g. "quiz.activated" → "events:quiz") so each
// future service subscribes to the streams it owns. Approximate MAXLEN keeps streams
// bounded without blocking.

export const EVENTS = Object.freeze({
  QUIZ_ACTIVATED: "quiz.activated",
  QUIZ_ENDED: "quiz.ended",
  SESSION_SUBMITTED: "session.submitted",
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
