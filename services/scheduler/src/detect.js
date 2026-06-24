import { query } from "./db.js";
import { DUE_EVENTS, publishDueOnce } from "./events.js";
import logger, { serializeError } from "./logger.js";

// Scheduled timestamps are stored as India wall-clock, so compare against the same zone.
const NOW_IST = "(NOW() AT TIME ZONE 'Asia/Kolkata')";
const PREWARM_WINDOW_MINUTES = Number(process.env.QUIZ_PREWARM_WINDOW_MINUTES || 2);
const PREWARM_DEDUP_SECONDS = Number(process.env.SCHEDULER_PREWARM_DEDUP_SECONDS || 60);

async function emitStartDue() {
  const { rows } = await query(
    `SELECT id FROM quizzes
     WHERE status = 'scheduled' AND scheduled_start IS NOT NULL
       AND scheduled_start <= ${NOW_IST}`,
  );
  for (const row of rows) {
    await publishDueOnce(DUE_EVENTS.START, row.id);
  }
}

async function emitEndDue() {
  const { rows } = await query(
    `SELECT id FROM quizzes
     WHERE status = 'active' AND scheduled_end IS NOT NULL
       AND scheduled_end <= ${NOW_IST}`,
  );
  for (const row of rows) {
    await publishDueOnce(DUE_EVENTS.END, row.id);
  }
}

async function emitPrewarmDue() {
  const { rows } = await query(
    `SELECT id FROM quizzes
     WHERE status = 'scheduled' AND scheduled_start IS NOT NULL
       AND scheduled_start BETWEEN ${NOW_IST}
         AND ${NOW_IST} + make_interval(mins => $1)`,
    [PREWARM_WINDOW_MINUTES],
  );
  for (const row of rows) {
    await publishDueOnce(DUE_EVENTS.PREWARM, row.id, PREWARM_DEDUP_SECONDS);
  }
}

// Swallow tick errors so one bad pass doesn't kill the loop.
export async function runDetectionTick() {
  try {
    await emitStartDue();
    await emitEndDue();
    await emitPrewarmDue();
  } catch (error) {
    logger.warn("scheduler.tick_failed", serializeError(error));
  }
}
