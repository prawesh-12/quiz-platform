import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { generateAccessToken } from "../utils/accessToken.js";
import { normalizeNullableText } from "../utils/text.js";
import { withTransaction } from "../utils/withTransaction.js";
import { planActivationWindow } from "./quizTiming.service.js";
import { enqueueQuizSnapshot } from "./quizSnapshot.service.js";
import { enqueueQuizUpserted } from "./quizEvents.service.js";
import * as quizzes from "../repositories/quizzes.repository.js";
import * as quizQuestions from "../repositories/quizQuestions.repository.js";
import { subjectBelongsToTeacher } from "../repositories/subjectAccess.repository.js";
import { selectBankQuestions } from "./questionBank.client.js";

const DEFAULT_DURATION_MINS = 15;
const MAX_TITLE_LENGTH = 255;

const NULLABLE_TEXT_FIELDS = new Set([
  "batch",
  "division",
  "group_nos",
  "scheduled_start",
  "scheduled_end",
  "access_code",
]);

const UPDATABLE_FIELDS = [
  "title",
  "duration_mins",
  "batch",
  "division",
  "group_nos",
  "status",
  "quiz_date",
  "scheduled_start",
  "scheduled_end",
  "access_code",
];

function normalizeQuizMeta(payload, userId) {
  return {
    title: payload.title,
    subject_id: payload.subject_id,
    created_by: userId,
    duration_mins: payload.duration_mins ?? DEFAULT_DURATION_MINS,
    batch: normalizeNullableText(payload.batch),
    division: normalizeNullableText(payload.division),
    group_nos: normalizeNullableText(payload.group_nos),
    quiz_date: payload.quiz_date ?? null,
    scheduled_start: normalizeNullableText(payload.scheduled_start),
    scheduled_end: normalizeNullableText(payload.scheduled_end),
    access_code: normalizeNullableText(payload.access_code),
    status: payload.status ?? "draft",
  };
}

// Resolve the real activation window (which may downgrade 'active' to 'scheduled').
function applyActivationWindow(metadata) {
  if (metadata.status !== "active") {
    return;
  }

  const plan = planActivationWindow({
    requestedStart: metadata.scheduled_start,
    requestedEnd: metadata.scheduled_end,
    durationMins: metadata.duration_mins,
  });

  if (plan.error) {
    throw new AppError(400, plan.error);
  }

  metadata.status = plan.status;
  metadata.scheduled_start = plan.scheduledStart;
  metadata.scheduled_end = plan.scheduledEnd;
}

async function assertSubjectOwned(subjectId, userId) {
  if (!(await subjectBelongsToTeacher(subjectId, userId))) {
    throw new AppError(404, "Subject not found");
  }
}

// After a create that persisted as active, announce state then warm the student snapshot,
// enqueued in the create tx so the events commit with the quiz row.
async function announceCreatedQuiz(client, quiz) {
  await enqueueQuizUpserted(client, quiz.id);
  if (quiz.status === "active") {
    await enqueueQuizSnapshot(client, quiz.id);
  }
}

export async function createManualQuiz({ userId, payload }) {
  const metadata = normalizeQuizMeta(payload, userId);
  applyActivationWindow(metadata);
  await assertSubjectOwned(metadata.subject_id, userId);

  const result = await withTransaction(async (client) => {
    const quiz = await quizzes.insertQuiz(client, metadata);
    const insertedQuestions = [];

    for (let index = 0; index < payload.questions.length; index += 1) {
      const item = payload.questions[index];
      const inlineId = await quizQuestions.insertInlineQuestion(client, quiz.id, item);
      await quizQuestions.linkInlineQuizQuestion(client, quiz.id, inlineId, index + 1);
      insertedQuestions.push({ ...item, id: inlineId });
    }

    await announceCreatedQuiz(client, quiz);
    return { quiz, questions: insertedQuestions };
  });

  return result;
}

export async function autoGenerateQuiz({ userId, payload }) {
  const metadata = normalizeQuizMeta(payload, userId);
  applyActivationWindow(metadata);
  await assertSubjectOwned(metadata.subject_id, userId);

  const questions = await selectBankQuestions({
    subjectId: metadata.subject_id,
    unitSelections: payload.unit_selections,
  });
  if (questions.length === 0) {
    throw new AppError(400, "No questions selected");
  }

  const result = await withTransaction(async (client) => {
    const quiz = await quizzes.insertQuiz(client, metadata);
    for (let index = 0; index < questions.length; index += 1) {
      const bank = questions[index];
      const inlineId = await quizQuestions.insertInlineQuestion(client, quiz.id, {
        ...bank,
        source_question_id: bank.id,
      });
      await quizQuestions.linkInlineQuizQuestion(client, quiz.id, inlineId, index + 1);
    }
    await announceCreatedQuiz(client, quiz);
    return { quiz, question_count: questions.length };
  });

  return result;
}

function resolveActivationPatch(normalized, existing) {
  const has = (key) => Object.prototype.hasOwnProperty.call(normalized, key);
  const plan = planActivationWindow({
    requestedStart: has("scheduled_start") ? normalized.scheduled_start : existing.scheduled_start,
    requestedEnd: has("scheduled_end") ? normalized.scheduled_end : existing.scheduled_end,
    durationMins: has("duration_mins") ? normalized.duration_mins : existing.duration_mins,
  });

  if (plan.error) {
    throw new AppError(400, plan.error);
  }

  normalized.status = plan.status;
  normalized.scheduled_start = plan.scheduledStart;
  normalized.scheduled_end = plan.scheduledEnd;
}

// Build the column patch for updateQuiz, resolving activation and access-token side effects.
function buildQuizPatch(payload, existing) {
  const normalized = { ...payload };

  if (normalized.status === "active") {
    resolveActivationPatch(normalized, existing);
  }

  let nextAccessToken = existing.access_token;
  if ((normalized.status === "active" || normalized.status === "scheduled") && !nextAccessToken) {
    nextAccessToken = generateAccessToken();
  }

  const patch = {};
  for (const field of UPDATABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(normalized, field)) {
      patch[field] = NULLABLE_TEXT_FIELDS.has(field)
        ? normalizeNullableText(normalized[field])
        : normalized[field];
    }
  }

  if (nextAccessToken !== existing.access_token) {
    patch.access_token = nextAccessToken;
  }

  return patch;
}

async function resolveReorderedQuestionIds(quizId, payload) {
  if (!Array.isArray(payload.question_ids)) {
    return null;
  }

  const existingIds = await quizQuestions.findQuizQuestionIdsOrdered(pool, quizId);
  const requestedIds = payload.question_ids.map(Number);
  const sortedExisting = [...existingIds].sort((a, b) => a - b);
  const sortedRequested = [...requestedIds].sort((a, b) => a - b);
  const matches =
    existingIds.length === requestedIds.length &&
    sortedExisting.every((value, index) => value === sortedRequested[index]);

  if (!matches) {
    throw new AppError(400, "question_ids must match current quiz question ids exactly");
  }

  return requestedIds;
}

async function applyUpdate(id, userId, patch, reorderedIds) {
  return withTransaction(async (client) => {
    if (reorderedIds) {
      for (let index = 0; index < reorderedIds.length; index += 1) {
        await quizQuestions.setQuizQuestionOrder(client, id, reorderedIds[index], index + 1);
      }
    }

    await quizzes.updateQuizColumns(client, id, userId, patch);
    const quiz = await quizzes.findQuizDetail(client, id, userId);

    await enqueueQuizUpserted(client, id);
    // A teacher edit must not leave students on a stale snapshot while the quiz runs.
    if (quiz?.status === "active") {
      await enqueueQuizSnapshot(client, id);
    }

    return { quiz };
  });
}

export async function updateQuiz({ id, userId, payload }) {
  const existing = await quizzes.findQuizOwnershipBasics(pool, id, userId);
  if (!existing) {
    throw new AppError(404, "Quiz not found");
  }

  const patch = buildQuizPatch(payload, existing);
  const reorderedIds = await resolveReorderedQuestionIds(id, payload);

  if (Object.keys(patch).length === 0 && !reorderedIds) {
    throw new AppError(400, "No valid fields to update");
  }

  return applyUpdate(id, userId, patch, reorderedIds);
}

export async function duplicateQuiz({ id, userId }) {
  const source = await quizzes.findQuizForDuplicate(pool, id, userId);
  if (!source) {
    throw new AppError(404, "Quiz not found");
  }

  const title = `Copy of ${source.title}`.slice(0, MAX_TITLE_LENGTH);
  const newQuizId = await withTransaction(async (client) => {
    const createdId = await quizzes.insertDuplicateQuiz(client, source, title);
    await quizQuestions.copyQuizQuestions(client, createdId, id);
    await enqueueQuizUpserted(client, createdId);
    return createdId;
  });

  return { quiz_id: newQuizId };
}
