import pool from "../config/db.js";
import { getRedis, isRedisReady } from "../config/redis.js";
import { readPositiveIntegerEnv } from "../utils/env.js";
import logger, { serializeError } from "../utils/logger.js";
import { fetchStudentQuizQuestions } from "../repositories/sessions.repository.js";

// Student-safe quiz snapshot (questions with correct answers stripped) cached in Redis
// so a quiz-start spike reads from cache, not PostgreSQL. Redis optional: PG fallback.

const SNAPSHOT_TTL_MS = readPositiveIntegerEnv("QUIZ_SNAPSHOT_TTL_MS", 4 * 60 * 60 * 1000);
const PREWARM_LOCK_MS = readPositiveIntegerEnv("QUIZ_PREWARM_LOCK_MS", 60000);
// Prewarm quizzes whose scheduled_start is within this window (minutes).
const PREWARM_WINDOW_MINUTES = readPositiveIntegerEnv("QUIZ_PREWARM_WINDOW_MINUTES", 2);

function snapshotKey(quizId) {
  return `quiz:${quizId}:student_snapshot`;
}

function prewarmLockKey(quizId) {
  return `quiz:${quizId}:prewarm_lock`;
}

// Strip correct_option so the student payload never carries answers, even in cache.
function sanitizeQuestions(rows) {
  return rows.map(({ correct_option, ...question }) => question);
}

// Full question set including correct_option (needed for scoring); sanitized before it
// ever reaches a student.
async function loadQuizQuestions(quizId) {
  return fetchStudentQuizQuestions(pool, quizId);
}

async function loadSanitizedQuestions(quizId) {
  return sanitizeQuestions(await loadQuizQuestions(quizId));
}

// Durable snapshot owned by the exam domain; keeps correct_option for server-side
// scoring. Best-effort so a write failure never blocks the caller.
async function storeSnapshotRow(quizId, questions) {
  try {
    await pool.query(
      `
      INSERT INTO exam.quiz_snapshot (quiz_id, payload)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (quiz_id) DO UPDATE
      SET payload = EXCLUDED.payload,
          built_at = NOW()
      `,
      [quizId, JSON.stringify(questions)]
    );
  } catch (error) {
    logger.warn("snapshot.row_store_failed", { quizId, ...serializeError(error) });
  }
}

async function storeSnapshot(quizId, questions) {
  const redis = getRedis();
  if (!redis || !isRedisReady()) {
    return false;
  }
  try {
    await redis.set(snapshotKey(quizId), JSON.stringify(questions), "PX", SNAPSHOT_TTL_MS);
    return true;
  } catch (error) {
    logger.warn("snapshot.store_failed", { quizId, ...serializeError(error) });
    return false;
  }
}

// Redis snapshot when warm, else build from PostgreSQL and backfill.
export async function getStudentSnapshotQuestions(quizId) {
  const redis = getRedis();

  if (redis && isRedisReady()) {
    try {
      const cached = await redis.get(snapshotKey(quizId));
      if (cached != null) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn("snapshot.read_failed", { quizId, ...serializeError(error) });
    }
  }

  const questions = await loadSanitizedQuestions(quizId);
  // Best-effort backfill so the next student in the spike hits cache.
  await storeSnapshot(quizId, questions);
  return questions;
}

// Force-rebuild after activation or edit. Persists the durable row regardless of Redis;
// warms the student cache when Redis is available.
export async function refreshQuizSnapshot(quizId) {
  const questions = await loadQuizQuestions(quizId);
  if (!questions.length) {
    return;
  }
  await storeSnapshotRow(quizId, questions);
  await storeSnapshot(quizId, sanitizeQuestions(questions));
}

export async function invalidateQuizSnapshot(quizId) {
  const redis = getRedis();
  if (!redis || !isRedisReady()) {
    return;
  }
  try {
    await redis.del(snapshotKey(quizId));
  } catch (error) {
    logger.warn("snapshot.invalidate_failed", { quizId, ...serializeError(error) });
  }
}

async function findPrewarmCandidates() {
  const result = await pool.query(
    `
    SELECT id
    FROM quizzes
    WHERE status = 'scheduled'
      AND scheduled_start IS NOT NULL
      AND scheduled_start BETWEEN (NOW() AT TIME ZONE 'Asia/Kolkata')
        AND (NOW() AT TIME ZONE 'Asia/Kolkata') + make_interval(mins => $1)
    ORDER BY scheduled_start ASC
    `,
    [PREWARM_WINDOW_MINUTES]
  );
  return result.rows;
}

// Worker job: warm snapshots for quizzes about to start. Per-quiz Redis lock prevents
// duplicate work across workers. No-op without Redis.
export async function prewarmScheduledQuizzes() {
  const redis = getRedis();
  if (!redis || !isRedisReady()) {
    return { prewarmed: 0, reason: "redis_unavailable" };
  }

  let prewarmed = 0;
  try {
    const candidates = await findPrewarmCandidates();
    for (const row of candidates) {
      let lock;
      try {
        lock = await redis.set(prewarmLockKey(row.id), "1", "PX", PREWARM_LOCK_MS, "NX");
      } catch (error) {
        logger.warn("snapshot.prewarm_lock_failed", { quizId: row.id, ...serializeError(error) });
        continue;
      }
      if (lock !== "OK") {
        continue; // another worker owns this quiz's prewarm
      }

      const questions = await loadQuizQuestions(row.id);
      if (!questions.length) {
        continue;
      }
      await storeSnapshotRow(row.id, questions);
      if (await storeSnapshot(row.id, sanitizeQuestions(questions))) {
        prewarmed += 1;
        logger.info("snapshot.prewarmed", { quizId: row.id, questions: questions.length });
      }
    }
  } catch (error) {
    logger.warn("snapshot.prewarm_failed", serializeError(error));
  }

  return { prewarmed };
}
