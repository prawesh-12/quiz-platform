import { EVENTS } from "../config/eventBus.js";
import { enqueueOutboxEvent } from "../config/outbox.js";
import * as quizzes from "../repositories/quizzes.repository.js";

// Lifecycle event carrying the full quiz metadata row; enqueued in the caller's tx so it
// commits atomically with the status/row change it describes.
export async function enqueueQuizUpserted(client, quizId) {
  const meta = await quizzes.findQuizMetaById(client, quizId);
  if (meta) {
    await enqueueOutboxEvent(client, EVENTS.QUIZ_UPSERTED, meta);
  }
}

export async function enqueueQuizEnded(client, quizId) {
  await enqueueOutboxEvent(client, EVENTS.QUIZ_ENDED, { quizId });
}

export async function enqueueQuizDeleted(client, quizId) {
  await enqueueOutboxEvent(client, EVENTS.QUIZ_DELETED, { quizId });
}
