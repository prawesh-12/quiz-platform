import pool from "../config/db.js";
import { EVENTS, publishEvent } from "../config/eventBus.js";
import { startStreamConsumer } from "../config/eventConsumer.js";
import logger, { serializeError } from "../utils/logger.js";
import { transitionQuizStatus } from "./quizLifecycle.service.js";
import { finalizePendingSessionsForQuiz } from "./sessionLifecycle.service.js";
import { refreshQuizSnapshot } from "./quizSnapshot.service.js";

// Reacts to the scheduler's due signals: status flip, auto-submit, snapshot build.

const SCHEDULER_STREAM = "events:scheduler";
const GROUP = "scheduler-reactors";

const START_DUE = "quiz.start_due";
const END_DUE = "quiz.end_due";
const PREWARM_DUE = "quiz.prewarm_due";

// Invalid (already-transitioned) flips roll back to null, so duplicate signals are no-ops.
async function transition(quizId, nextStatus) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await transitionQuizStatus(client, { quizId, nextStatus, enforceTransition: true });
    if (result?.error) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function handleStartDue(quizId) {
  const result = await transition(quizId, "active");
  // A future-dated quiz persists as 'scheduled', not 'active' — only act on activation.
  if (result?.quiz?.status === "active") {
    await publishEvent(EVENTS.QUIZ_ACTIVATED, { quizId, accessToken: result.quiz.access_token ?? null });
    await refreshQuizSnapshot(quizId);
  }
}

async function handleEndDue(quizId) {
  const result = await transition(quizId, "ended");
  if (!result) {
    return;
  }
  await publishEvent(EVENTS.QUIZ_ENDED, { quizId });
  if (result.requires_finalization) {
    await finalizePendingSessionsForQuiz(quizId);
  }
}

async function handle(message) {
  let quizId = null;
  try {
    quizId = Number(JSON.parse(message.payload || "{}").quizId);
  } catch (error) {
    logger.warn("scheduler_consumer.bad_payload", serializeError(error));
    return;
  }
  if (!Number.isInteger(quizId) || quizId <= 0) {
    return;
  }

  if (message.type === START_DUE) {
    await handleStartDue(quizId);
  } else if (message.type === END_DUE) {
    await handleEndDue(quizId);
  } else if (message.type === PREWARM_DUE) {
    await refreshQuizSnapshot(quizId);
  }
}

export function startSchedulerConsumer() {
  return startStreamConsumer({
    stream: SCHEDULER_STREAM,
    group: GROUP,
    consumer: process.env.HOSTNAME || "worker",
    handler: handle,
  });
}
