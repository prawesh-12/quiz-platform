import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { generateAccessToken } from "../utils/accessToken.js";
import { readPositiveIntegerEnv } from "../utils/env.js";
import { normalizeNullableText } from "../utils/text.js";
import { withTransaction } from "../utils/withTransaction.js";
import { EVENTS, publishEvent } from "../config/eventBus.js";
import { getCachedJson, invalidateCachePrefix } from "./cache.service.js";
import { invalidateQuizSnapshot, refreshQuizSnapshot } from "./quizSnapshot.service.js";
import { planActivationWindow, resolveQuizWindow } from "./quizTiming.service.js";
import { transitionQuizStatus } from "./quizLifecycle.service.js";
import { finalizePendingSessionsForQuiz } from "./sessionLifecycle.service.js";
import * as quizzes from "../repositories/quizzes.repository.js";
import { subjectBelongsToTeacher } from "../repositories/subjectAccess.repository.js";
import { selectBankQuestions } from "./questionBank.client.js";

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
    duration_mins: payload.duration_mins ?? 15,
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

// When a quiz is created/updated as 'active', resolve the real activation window
// (which may downgrade it to 'scheduled' if it starts in the future).
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

export async function listQuizzes({ userId, search, status, page, limit }) {
  const offset = (page - 1) * limit;
  const rows = await quizzes.listQuizzesForOwner(pool, { userId, status, search, limit, offset });
  const total = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return { data: rows, quizzes: rows, total, count: total, page, totalPages };
}

export async function createManualQuiz({ userId, payload }) {
  const metadata = normalizeQuizMeta(payload, userId);
  applyActivationWindow(metadata);
  await assertSubjectOwned(metadata.subject_id, userId);

  return withTransaction(async (client) => {
    const quiz = await quizzes.insertQuiz(client, metadata);
    const insertedQuestions = [];

    for (let index = 0; index < payload.questions.length; index += 1) {
      const item = payload.questions[index];
      const inlineId = await quizzes.insertInlineQuestion(client, quiz.id, item);
      await quizzes.linkInlineQuizQuestion(client, quiz.id, inlineId, index + 1);
      insertedQuestions.push({ ...item, id: inlineId });
    }

    return { quiz, questions: insertedQuestions };
  });
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

  return withTransaction(async (client) => {
    const quiz = await quizzes.insertQuiz(client, metadata);
    for (let index = 0; index < questions.length; index += 1) {
      const bank = questions[index];
      const inlineId = await quizzes.insertInlineQuestion(client, quiz.id, {
        ...bank,
        source_question_id: bank.id,
      });
      await quizzes.linkInlineQuizQuestion(client, quiz.id, inlineId, index + 1);
    }
    return { quiz, question_count: questions.length };
  });
}

export async function getQuizWithQuestions({ id, userId }) {
  const quiz = await quizzes.findQuizDetail(pool, id, userId);
  if (!quiz) {
    throw new AppError(404, "Quiz not found");
  }

  const questions = await quizzes.findQuizQuestions(pool, id);
  return { quiz, questions };
}

// Build the column patch for updateQuiz, resolving activation and access-token side effects.
function buildQuizPatch(payload, existing) {
  const normalized = { ...payload };

  if (normalized.status === "active") {
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

  const existingIds = await quizzes.findQuizQuestionIdsOrdered(pool, quizId);
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

  const updated = await withTransaction(async (client) => {
    if (reorderedIds) {
      for (let index = 0; index < reorderedIds.length; index += 1) {
        await quizzes.setQuizQuestionOrder(client, id, reorderedIds[index], index + 1);
      }
    }

    await quizzes.updateQuizColumns(client, id, userId, patch);
    const quiz = await quizzes.findQuizDetail(client, id, userId);
    return { quiz };
  });

  // A teacher edit must not leave students on a stale snapshot; next entry rebuilds it.
  await invalidateQuizSnapshot(id);

  return updated;
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

  // Keep the snapshot consistent with lifecycle: warm on (re)activation, else drop.
  if (transition.quiz?.status === "active" || transition.quiz?.status === "scheduled") {
    await refreshQuizSnapshot(id);
  } else {
    await invalidateQuizSnapshot(id);
  }

  // Drop the cached live-stats so the teacher's monitor reflects the new status (and the
  // clamped end time) on the very next poll instead of serving stale data for the TTL.
  await invalidateCachePrefix(`quiz:${id}:live_stats:`);

  // Publish the lifecycle event after the status commit (best-effort; no-op without Redis).
  if (transition.quiz?.status === "active") {
    await publishEvent(EVENTS.QUIZ_ACTIVATED, {
      quizId: id,
      accessToken: transition.quiz.access_token ?? null,
    });
  } else if (transition.quiz?.status === "ended") {
    await publishEvent(EVENTS.QUIZ_ENDED, { quizId: id });
  }

  // Auto-submit after the status commit; best-effort so a failure doesn't undo the end.
  let autoSubmittedCount = 0;
  if (transition.requires_finalization) {
    try {
      autoSubmittedCount = await finalizePendingSessionsForQuiz(id);
    } catch (error) {
      console.error(`Failed to auto-submit pending sessions for quiz ${id}:`, error);
    }
  }

  return { quiz: transition.quiz, autoSubmittedCount };
}

export async function removeQuiz({ id, userId }) {
  const owned = await quizzes.findQuizOwnershipBasics(pool, id, userId);
  if (!owned) {
    throw new AppError(404, "Quiz not found");
  }

  await withTransaction((client) => quizzes.deleteQuizCascade(client, id, userId));
}

// Short-TTL cache (Redis when available, else process-local) so multiple teachers
// polling the same quiz don't each re-run the aggregates. Keyed by quiz + owner.
const LIVE_STATS_TTL_MS = readPositiveIntegerEnv("LIVE_STATS_TTL_MS", 3000);

export async function getLiveStats({ id, userId }) {
  return getCachedJson(`quiz:${id}:live_stats:${userId}`, LIVE_STATS_TTL_MS, () =>
    computeLiveStats({ id, userId })
  );
}

async function computeLiveStats({ id, userId }) {
  const row = await quizzes.findLiveStatsQuiz(pool, id, userId);
  if (!row) {
    throw new AppError(404, "Quiz not found");
  }

  const counts = await quizzes.findSessionStatusCounts(pool, id);
  const flagged = await quizzes.findFlaggedSessionCount(pool, id);

  const { server_now: serverNow, ...quiz } = row;
  const quizWindow = resolveQuizWindow(quiz, serverNow);
  const elapsedSeconds =
    quizWindow.phase === "scheduled"
      ? 0
      : Math.max(0, quizWindow.totalDurationSeconds - quizWindow.secondsUntilEnd);

  return {
    quiz,
    stats: {
      total_entered: Number(counts?.total_entered || 0),
      submitted: Number(counts?.submitted || 0),
      pending: Number(counts?.pending || 0),
      flagged: Number(flagged || 0),
      elapsed_seconds: elapsedSeconds,
      quiz_start_time: quizWindow.startAt.toISOString(),
      server_now: quizWindow.now.toISOString(),
      total_duration_seconds: quizWindow.totalDurationSeconds,
    },
  };
}

export async function getPreview({ id, userId }) {
  const quiz = await quizzes.findQuizPreviewMeta(pool, id, userId);
  if (!quiz) {
    throw new AppError(404, "Quiz not found");
  }

  const questions = await quizzes.findQuizQuestionsPreview(pool, id);
  return { quiz, questions };
}

export async function getExportData({ id, userId }) {
  const quiz = await quizzes.findQuizBasic(pool, id, userId);
  if (!quiz) {
    throw new AppError(404, "Quiz not found");
  }

  const students = (await quizzes.findExportSummaryRows(pool, id)).map((row) => ({
    name: row.name,
    roll_no: row.roll_no || "",
    email: row.email,
    division: row.division,
    group_no: row.group_no,
    score: row.score,
    total_points: row.total_points,
    violation_count: Number(row.violation_count || 0),
  }));

  // Natural alphanumeric order by roll number.
  students.sort((a, b) =>
    a.roll_no.localeCompare(b.roll_no, undefined, { numeric: true, sensitivity: "base" }),
  );

  return { quizId: id, students };
}

export async function duplicateQuiz({ id, userId }) {
  const source = await quizzes.findQuizForDuplicate(pool, id, userId);
  if (!source) {
    throw new AppError(404, "Quiz not found");
  }

  const title = `Copy of ${source.title}`.slice(0, 255);
  const newQuizId = await withTransaction(async (client) => {
    const createdId = await quizzes.insertDuplicateQuiz(client, source, title);
    await quizzes.copyQuizQuestions(client, createdId, id);
    return createdId;
  });

  return { quiz_id: newQuizId };
}

export async function getLeaderboard({ id, userId }) {
  const owned = await quizzes.findQuizOwnershipBasics(pool, id, userId);
  if (!owned) {
    throw new AppError(404, "Quiz not found");
  }

  const leaderboard = (await quizzes.findLeaderboard(pool, id)).map((row, index) => ({
    rank: index + 1,
    session_id: row.session_id,
    name: row.name,
    roll_no: row.roll_no,
    score: row.score,
    total_points: row.total_points,
    time_taken_secs: row.time_taken_secs,
  }));

  return { leaderboard };
}
