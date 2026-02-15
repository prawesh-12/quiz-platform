import pool from "../config/db.js";
import { transitionQuizStatus } from "./quizLifecycle.service.js";

async function processScheduledTransitions() {
  const client = await pool.connect();

  try {
    const startRows = await client.query(
      `
      SELECT id
      FROM quizzes
      WHERE status = 'draft'
        AND scheduled_start IS NOT NULL
        AND scheduled_start <= NOW()
      ORDER BY scheduled_start ASC, id ASC
      `
    );

    for (const row of startRows.rows) {
      await client.query("BEGIN");
      const result = await transitionQuizStatus(client, {
        quizId: row.id,
        nextStatus: "active",
        enforceTransition: true
      });

      if (result?.error) {
        await client.query("ROLLBACK");
      } else {
        await client.query("COMMIT");
      }
    }

    const endRows = await client.query(
      `
      SELECT id
      FROM quizzes
      WHERE status = 'active'
        AND scheduled_end IS NOT NULL
        AND scheduled_end <= NOW()
      ORDER BY scheduled_end ASC, id ASC
      `
    );

    for (const row of endRows.rows) {
      await client.query("BEGIN");
      const result = await transitionQuizStatus(client, {
        quizId: row.id,
        nextStatus: "ended",
        enforceTransition: true
      });

      if (result?.error) {
        await client.query("ROLLBACK");
      } else {
        await client.query("COMMIT");
      }
    }
  } finally {
    client.release();
  }
}

export function startQuizScheduler() {
  let inFlight = false;

  const run = async () => {
    if (inFlight) {
      return;
    }

    inFlight = true;
    try {
      await processScheduledTransitions();
    } catch (error) {
      console.error("Quiz scheduler failed:", error);
    } finally {
      inFlight = false;
    }
  };

  // Trigger once at startup, then every minute.
  run();
  const timer = setInterval(run, 60 * 1000);
  timer.unref?.();

  return {
    stop() {
      clearInterval(timer);
    }
  };
}
