import pool from "../config/db.js";
import { startStreamConsumer } from "../config/eventConsumer.js";
import { withTransaction } from "../utils/withTransaction.js";
import logger, { serializeError } from "../utils/logger.js";
import { transitionQuizStatus } from "../services/quizLifecycle.service.js";
import { enqueueQuizSnapshot } from "../services/quizSnapshot.service.js";
import { enqueueQuizUpserted, enqueueQuizEnded } from "../services/quizEvents.service.js";

// Reacts to the scheduler's due signals: status flip and snapshot build. Quiz never
// touches Exam tables; auto-submit is the Exam service's reaction to quiz.ended.

const SCHEDULER_STREAM = "events:scheduler";
const GROUP = "quiz-scheduler-reactor";

const START_DUE = "quiz.start_due";
const END_DUE = "quiz.end_due";
const PREWARM_DUE = "quiz.prewarm_due";

// Flip status and enqueue its events in one tx. Invalid (already-transitioned) flips roll
// back to null, so duplicate signals are no-ops. enqueue runs before commit with the client.
async function transition(quizId, nextStatus, enqueue) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await transitionQuizStatus(client, { quizId, nextStatus, enforceTransition: true });
    if (result?.error) {
      await client.query("ROLLBACK");
      return null;
    }
    await enqueue(client, result);
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
  await transition(quizId, "active", async (client, result) => {
    // A future-dated quiz persists as 'scheduled', not 'active' — only act on activation.
    if (result?.quiz?.status === "active") {
      await enqueueQuizUpserted(client, quizId);
      await enqueueQuizSnapshot(client, quizId);
    }
  });
}

async function handleEndDue(quizId) {
  await transition(quizId, "ended", async (client) => {
    await enqueueQuizUpserted(client, quizId);
    await enqueueQuizEnded(client, quizId);
  });
}

function parseQuizId(message) {
  try {
    return Number(JSON.parse(message.payload || "{}").quizId);
  } catch (error) {
    logger.warn("scheduler_consumer.bad_payload", serializeError(error));
    return null;
  }
}

async function handle(message) {
  const quizId = parseQuizId(message);
  if (!Number.isInteger(quizId) || quizId <= 0) {
    return;
  }

  if (message.type === START_DUE) {
    await handleStartDue(quizId);
  } else if (message.type === END_DUE) {
    await handleEndDue(quizId);
  } else if (message.type === PREWARM_DUE) {
    await withTransaction((client) => enqueueQuizSnapshot(client, quizId));
  }
}

export function startSchedulerConsumer() {
  return startStreamConsumer({
    stream: SCHEDULER_STREAM,
    group: GROUP,
    consumer: process.env.HOSTNAME || `quiz-${process.pid}`,
    handler: handle,
  });
}
