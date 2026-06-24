import { getRedis, isRedisReady } from "./redis.js";
import logger, { serializeError } from "./logger.js";

// Dedicated stream of due-quiz signals; the monolith consumer does the actual work.

export const SCHEDULER_STREAM = "events:scheduler";

export const DUE_EVENTS = Object.freeze({
  START: "quiz.start_due",
  END: "quiz.end_due",
  PREWARM: "quiz.prewarm_due",
});

const STREAM_MAXLEN = Number(process.env.EVENT_STREAM_MAXLEN || 10000);
const DEDUP_TTL_SECONDS = Number(process.env.SCHEDULER_DEDUP_TTL_SECONDS || 15);

// Dedup key throttles re-emits; its expiry is what eventually retries an unhandled signal.
export async function publishDueOnce(type, quizId, ttlSeconds = DEDUP_TTL_SECONDS) {
  const redis = getRedis();
  if (!redis || !isRedisReady()) {
    return false;
  }

  try {
    const reserved = await redis.set(`sched:${type}:${quizId}`, "1", "EX", ttlSeconds, "NX");
    if (reserved !== "OK") {
      return false;
    }

    await redis.xadd(
      SCHEDULER_STREAM,
      "MAXLEN",
      "~",
      STREAM_MAXLEN,
      "*",
      "type",
      type,
      "payload",
      JSON.stringify({ quizId }),
      "ts",
      String(Date.now()),
    );
    return true;
  } catch (error) {
    logger.warn("scheduler.publish_failed", { type, quizId, ...serializeError(error) });
    return false;
  }
}
