import pool from "../config/db.js";
import { EVENTS, publishEvent } from "../config/eventBus.js";
import * as quizzes from "../repositories/quizzes.repository.js";

// Best-effort lifecycle event carrying the full quiz metadata row.
export async function emitQuizUpserted(quizId) {
  const meta = await quizzes.findQuizMetaById(pool, quizId);
  if (meta) {
    await publishEvent(EVENTS.QUIZ_UPSERTED, meta);
  }
}

export async function emitQuizEnded(quizId) {
  await publishEvent(EVENTS.QUIZ_ENDED, { quizId });
}

export async function emitQuizDeleted(quizId) {
  await publishEvent(EVENTS.QUIZ_DELETED, { quizId });
}
