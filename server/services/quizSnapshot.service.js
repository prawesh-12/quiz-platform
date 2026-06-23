import pool from "../config/db.js";
import { getRedis, isRedisReady } from "../config/redis.js";
import { readPositiveIntegerEnv } from "../utils/env.js";
import logger, { serializeError } from "../utils/logger.js";

// Student-safe quiz snapshot cached in Redis; the durable copy lives in exam.quiz_snapshot,
// fed by the quiz service. Question content is never read from the quiz tables here.

const SNAPSHOT_TTL_MS = readPositiveIntegerEnv("QUIZ_SNAPSHOT_TTL_MS", 4 * 60 * 60 * 1000);

function snapshotKey(quizId) {
  return `quiz:${quizId}:student_snapshot`;
}

function sanitizeQuestions(rows) {
  return rows.map(({ correct_option, ...question }) => question);
}

async function storeSnapshotRow(quizId, questions) {
  try {
    await pool.query(
      `
      INSERT INTO exam.quiz_snapshot (quiz_id, payload)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (quiz_id) DO UPDATE
      SET payload = EXCLUDED.payload, built_at = NOW()
      `,
      [quizId, JSON.stringify(questions)]
    );
  } catch (error) {
    logger.warn("snapshot.row_store_failed", { quizId, ...serializeError(error) });
  }
}

async function storeRedisSnapshot(quizId, sanitizedQuestions) {
  const redis = getRedis();
  if (!redis || !isRedisReady()) {
    return false;
  }
  try {
    await redis.set(snapshotKey(quizId), JSON.stringify(sanitizedQuestions), "PX", SNAPSHOT_TTL_MS);
    return true;
  } catch (error) {
    logger.warn("snapshot.store_failed", { quizId, ...serializeError(error) });
    return false;
  }
}

async function loadSnapshotQuestions(quizId) {
  const result = await pool.query(`SELECT payload FROM exam.quiz_snapshot WHERE quiz_id = $1`, [quizId]);
  return result.rows[0]?.payload ?? [];
}

// Apply a quiz.snapshot event: persist the durable row and warm the student cache.
export async function applyQuizSnapshot(quizId, questions) {
  if (!questions?.length) {
    return;
  }
  await storeSnapshotRow(quizId, questions);
  await storeRedisSnapshot(quizId, sanitizeQuestions(questions));
}

// Redis when warm, else the durable snapshot; backfill Redis.
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

  const questions = sanitizeQuestions(await loadSnapshotQuestions(quizId));
  await storeRedisSnapshot(quizId, questions);
  return questions;
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

export async function deleteQuizSnapshot(quizId) {
  try {
    await pool.query(`DELETE FROM exam.quiz_snapshot WHERE quiz_id = $1`, [quizId]);
  } catch (error) {
    logger.warn("snapshot.delete_failed", { quizId, ...serializeError(error) });
  }
  await invalidateQuizSnapshot(quizId);
}
