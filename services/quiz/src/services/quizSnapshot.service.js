import { EVENTS } from "../config/eventBus.js";
import { enqueueOutboxEvent } from "../config/outbox.js";
import { fetchStudentQuizQuestions } from "../repositories/quizQuestions.repository.js";

// Builds the full question set (including correct_option for scoring) and enqueues it as a
// quiz.snapshot event. The Exam service owns durable/Redis snapshot storage; Quiz only
// produces the source of truth on activation, prewarm, and edit-while-active. Enqueued in the
// caller's tx so the snapshot commits atomically with the quiz change that triggered it.
export async function enqueueQuizSnapshot(client, quizId) {
  const questions = await fetchStudentQuizQuestions(client, quizId);
  if (!questions.length) {
    return;
  }

  await enqueueOutboxEvent(client, EVENTS.QUIZ_SNAPSHOT, { quizId, questions });
}
