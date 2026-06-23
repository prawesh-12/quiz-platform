import pool from "../config/db.js";
import { EVENTS, publishEvent } from "../config/eventBus.js";
import { fetchStudentQuizQuestions } from "../repositories/quizQuestions.repository.js";

// Builds the full question set (including correct_option for scoring) and emits it as a
// quiz.snapshot event. The Exam service owns durable/Redis snapshot storage; Quiz only
// produces the source of truth on activation, prewarm, and edit-while-active.

export async function buildQuizSnapshot(quizId) {
  return fetchStudentQuizQuestions(pool, quizId);
}

// Best-effort: a no-Redis or failed publish never blocks the lifecycle caller.
export async function emitQuizSnapshot(quizId) {
  const questions = await buildQuizSnapshot(quizId);
  if (!questions.length) {
    return false;
  }

  return publishEvent(EVENTS.QUIZ_SNAPSHOT, { quizId, questions });
}
