import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { withTransaction } from "../utils/withTransaction.js";
import { transitionQuizStatus } from "./quizLifecycle.service.js";
import { emitQuizSnapshot } from "./quizSnapshot.service.js";
import { emitQuizUpserted, emitQuizEnded, emitQuizDeleted } from "./quizEvents.service.js";
import * as quizzes from "../repositories/quizzes.repository.js";
import * as quizQuestions from "../repositories/quizQuestions.repository.js";

export {
  createManualQuiz,
  autoGenerateQuiz,
  updateQuiz,
  duplicateQuiz,
} from "./quizMutation.service.js";

export async function listQuizzes({ userId, search, status, page, limit }) {
  const offset = (page - 1) * limit;
  const rows = await quizzes.listQuizzesForOwner(pool, { userId, status, search, limit, offset });
  const total = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return { data: rows, quizzes: rows, total, count: total, page, totalPages };
}

export async function getQuizWithQuestions({ id, userId }) {
  const quiz = await quizzes.findQuizDetail(pool, id, userId);
  if (!quiz) {
    throw new AppError(404, "Quiz not found");
  }

  const questions = await quizQuestions.findQuizQuestions(pool, id);
  return { quiz, questions };
}

// Keep snapshot, lifecycle event, and end signal consistent after a status commit.
async function announceStatusChange(id, transition) {
  await emitQuizUpserted(id);

  if (transition.quiz?.status === "active") {
    await emitQuizSnapshot(id);
  } else if (transition.quiz?.status === "ended") {
    await emitQuizEnded(id);
  }
}

export async function changeQuizStatus({ id, userId, status }) {
  const owned = await quizzes.findQuizOwnershipBasics(pool, id, userId);
  if (!owned) {
    throw new AppError(404, "Quiz not found");
  }

  const transition = await withTransaction(async (client) => {
    const result = await transitionQuizStatus(client, {
      quizId: id,
      nextStatus: status,
      enforceTransition: true,
    });

    if (result?.error) {
      throw new AppError(400, result.error);
    }

    return result;
  });

  await announceStatusChange(id, transition);

  return { quiz: transition.quiz, autoSubmittedCount: 0 };
}

export async function removeQuiz({ id, userId }) {
  const owned = await quizzes.findQuizOwnershipBasics(pool, id, userId);
  if (!owned) {
    throw new AppError(404, "Quiz not found");
  }

  const deleted = await withTransaction((client) => quizzes.deleteQuizCascade(client, id, userId));
  if (deleted) {
    await emitQuizDeleted(id);
  }
}

export async function getPreview({ id, userId }) {
  const quiz = await quizzes.findQuizPreviewMeta(pool, id, userId);
  if (!quiz) {
    throw new AppError(404, "Quiz not found");
  }

  const questions = await quizQuestions.findQuizQuestionsPreview(pool, id);
  return { quiz, questions };
}
