import pool from "../config/db.js";
import { transitionQuizStatus } from "./quizLifecycle.service.js";

export async function processScheduledTransitions() {
  const client = await pool.connect();

  try {
    const startRows = await client.query(
      `
      SELECT id
      FROM quizzes
      WHERE status = 'scheduled'
        AND scheduled_start IS NOT NULL
        AND scheduled_start <= (NOW() AT TIME ZONE 'Asia/Kolkata')
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
        console.error(`Scheduler failed to activate quiz ${row.id}:`, result.error);
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
        AND scheduled_end <= (NOW() AT TIME ZONE 'Asia/Kolkata')
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

export async function startQuizScheduler() {
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

  // Run once before serving requests, then poll every second so transitions stay aligned to server clock.
  await run();
  const timer = setInterval(run, 1000);
  timer.unref?.();

  return {
    stop() {
      clearInterval(timer);
    }
  };
}
