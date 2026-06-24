import { getRedis, isRedisReady } from "./redis.js";
import { readPositiveIntegerEnv } from "../utils/env.js";
import logger, { serializeError } from "../utils/logger.js";

// Best-effort event bus over Redis Streams; no Redis is a silent no-op. All auth events
// land on a single stream so downstream services consume one place.

const AUTH_STREAM = "events:auth";

export const EVENTS = Object.freeze({
  TEACHER_UPSERTED: "teacher.upserted",
  TEACHER_DELETED: "teacher.deleted",
  TEACHER_SUBJECTS_ASSIGNED: "teacher_subjects.assigned",
  TEACHER_SUBJECTS_REMOVED: "teacher_subjects.removed",
});

const STREAM_MAXLEN = readPositiveIntegerEnv("EVENT_STREAM_MAXLEN", 10000);

// All auth events share one stream; the outbox stores it per row for relay/debugging.
export function resolveStream() {
  return AUTH_STREAM;
}

// Returns the stream entry id on success, or false when nothing was published.
export async function publishEvent(type, payload = {}) {
  const redis = getRedis();
  if (!redis || !isRedisReady()) {
    return false;
  }

  try {
    const id = await redis.xadd(
      AUTH_STREAM,
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
