import "dotenv/config";

import pool from "../config/db.js";
import { refreshQuizSnapshot } from "../services/quizSnapshot.service.js";
import logger, { serializeError } from "../utils/logger.js";

// One-time: build a durable snapshot row for every currently-active quiz that lacks one.
// New activations populate exam.quiz_snapshot automatically, so this only covers quizzes
// already active at rollout. Safe to re-run (refresh upserts).
try {
  const { rows } = await pool.query(
    `
    SELECT id
    FROM quizzes
    WHERE status = 'active'
      AND id NOT IN (SELECT quiz_id FROM exam.quiz_snapshot)
    ORDER BY id ASC
    `
  );

  for (const row of rows) {
    await refreshQuizSnapshot(row.id);
    logger.info("snapshot.backfilled", { quizId: row.id });
  }

  logger.info("snapshot.backfill_complete", { count: rows.length });
  await pool.end();
  process.exit(0);
} catch (error) {
  logger.error("snapshot.backfill_failed", serializeError(error));
  await pool.end().catch(() => {});
  process.exit(1);
}
