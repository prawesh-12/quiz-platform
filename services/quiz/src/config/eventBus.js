import { getRedis, isRedisReady } from "./redis.js";
import { readPositiveIntegerEnv } from "../utils/env.js";
import logger, { serializeError } from "../utils/logger.js";

// Best-effort event bus over Redis Streams; no Redis is a silent no-op. All quiz events
// land on a single stream so downstream services (Exam, Analytics) consume one place.

const QUIZ_STREAM = "events:quiz";

export const EVENTS = Object.freeze({
  QUIZ_UPSERTED: "quiz.upserted",
  QUIZ_SNAPSHOT: "quiz.snapshot",
  QUIZ_ENDED: "quiz.ended",
  QUIZ_DELETED: "quiz.deleted",
});

const STREAM_MAXLEN = readPositiveIntegerEnv("EVENT_STREAM_MAXLEN", 10000);

// Returns the stream entry id on success, or false when nothing was published.
export async function publishEvent(type, payload = {}) {
  const redis = getRedis();
  if (!redis || !isRedisReady()) {
    return false;
  }

  try {
    const id = await redis.xadd(
      QUIZ_STREAM,
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
