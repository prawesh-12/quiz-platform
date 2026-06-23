import pool from "../config/db.js";
import { EVENTS, publishEvent } from "../config/eventBus.js";
import logger, { serializeError } from "../utils/logger.js";
import { transitionQuizStatus } from "./quizLifecycle.service.js";
import { finalizePendingSessionsForQuiz } from "./sessionLifecycle.service.js";

// Run the scheduler in exactly one process — set SCHEDULER_ENABLED=false on API
// instances and let the worker own transitions. (No session advisory lock here: those
// are unreliable behind transaction-mode poolers like Neon's pooler / PgBouncer, where
// the unlock can land on a different backend and the lock leaks, stalling the scheduler.
// Duplicate transitions across processes are harmless: the status flip is idempotent and
// auto-submit uses FOR UPDATE SKIP LOCKED.)
export async function processScheduledTransitions() {
  const client = await pool.connect();

  try {
    await runTransitions(client);
  } finally {
    client.release();
  }
}

async function runTransitions(client) {
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
      logger.error("scheduler.activate_failed", { quizId: row.id, error: result.error });
      await client.query("ROLLBACK");
    } else {
      await client.query("COMMIT");
      // A future-dated quiz persists as 'scheduled', not 'active' — only emit on activation.
      if (result.quiz?.status === "active") {
        await publishEvent(EVENTS.QUIZ_ACTIVATED, {
          quizId: row.id,
          accessToken: result.quiz.access_token ?? null,
        });
      }
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

  const quizzesToFinalize = [];
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
      await publishEvent(EVENTS.QUIZ_ENDED, { quizId: row.id });
      if (result.requires_finalization) {
        quizzesToFinalize.push(row.id);
      }
    }
  }

  // Auto-submit after the 'ended' status committed; one quiz failing must not block the rest.
  for (const quizId of quizzesToFinalize) {
    try {
      await finalizePendingSessionsForQuiz(quizId);
    } catch (error) {
      logger.error("scheduler.auto_submit_failed", { quizId, ...serializeError(error) });
    }
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
      logger.error("scheduler.tick_failed", serializeError(error));
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
