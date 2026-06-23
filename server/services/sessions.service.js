import { v4 as uuidv4 } from "uuid";

import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { withTransaction } from "../utils/withTransaction.js";
import { getStudentSnapshotQuestions } from "./quizSnapshot.service.js";
import { resolveQuizWindow } from "./quizTiming.service.js";
import {
  fetchStoredAnswers,
  finalizeSessionSubmission,
  upsertSessionAnswers,
} from "./sessionLifecycle.service.js";
import * as sessions from "../repositories/sessions.repository.js";

function withPercent(score, totalPoints) {
  if (score == null || !totalPoints) {
    return null;
  }

  return Number(((Number(score) / Number(totalPoints)) * 100).toFixed(2));
}

function timingPayload(window) {
  return {
    server_now: window.now.toISOString(),
    quiz_state: window.phase,
    start_time: window.startAt.toISOString(),
    end_time: window.endAt.toISOString(),
    countdown_to_start_secs: window.secondsUntilStart,
    duration_secs: window.responseTimerSeconds,
    total_duration_secs: window.totalDurationSeconds,
  };
}

function buildSessionContext(row) {
  if (!row) {
    return null;
  }

  const quizWindow = resolveQuizWindow(
    {
      status: row.quiz_status,
      scheduled_start: row.scheduled_start,
      scheduled_end: row.scheduled_end,
      duration_mins: row.duration_mins,
      created_at: row.created_at,
    },
    row.server_now,
  );

  return { session: row, quizWindow };
}

function mapBreakdown(rows) {
  return rows.map((row) => ({
    order_no: row.order_no,
    question_id: Number(row.question_id),
    question_text: row.question_text,
    points: Number(row.points || 1),
    selected_option: row.selected_option,
    correct_option: row.correct_option,
    is_correct: Boolean(row.is_correct),
  }));
}

function submittedResultPayload(session, quizWindow, breakdown) {
  return {
    already_submitted: true,
    score: Number(session.score ?? 0),
    total_points: Number(session.total_points ?? 0),
    percentage: withPercent(session.score, session.total_points),
    breakdown,
    ...timingPayload(quizWindow),
  };
}

// Reject writes when the quiz is not currently accepting responses.
function assertQuizAcceptingResponses(quizWindow) {
  if (quizWindow.phase === "scheduled") {
    throw new AppError(409, "Quiz has not started yet", timingPayload(quizWindow));
  }

  if (quizWindow.phase !== "active") {
    throw new AppError(409, "Quiz has ended. Responses are no longer accepted.", {
      session_closed: true,
      ...timingPayload(quizWindow),
    });
  }
}

export async function getSessionTiming(sessionToken) {
  const context = buildSessionContext(await sessions.findSessionContextRow(pool, sessionToken));
  if (!context) {
    throw new AppError(404, "Session not found");
  }

  const { session, quizWindow } = context;
  return {
    session_closed: session.status !== "pending" || quizWindow.phase === "ended",
    already_submitted: session.status === "submitted",
    ...timingPayload(quizWindow),
  };
}

export async function getSessionResult(sessionToken) {
  const context = buildSessionContext(await sessions.findSessionContextRow(pool, sessionToken));
  if (!context) {
    throw new AppError(404, "Session not found");
  }

  const { session, quizWindow } = context;
  if (session.status !== "submitted") {
    throw new AppError(409, "Session result is not available yet", timingPayload(quizWindow));
  }

  const breakdown = mapBreakdown(await sessions.fetchBreakdownRows(pool, session.id, session.quiz_id));
  return submittedResultPayload(session, quizWindow, breakdown);
}

export async function enterSession(payload) {
  const quiz = await sessions.findActiveQuizByAccessToken(pool, payload.access_token);
  if (!quiz) {
    throw new AppError(404, "Quiz is not available or not active");
  }

  if (!quiz.access_code) {
    throw new AppError(400, "This quiz is not configured with an access code.");
  }

  if (quiz.access_code !== payload.access_code) {
    throw new AppError(403, "Invalid access code");
  }

  // Student-safe questions from the Redis snapshot (PG fallback) — absorbs the start spike.
  const sanitizedQuestions = await getStudentSnapshotQuestions(quiz.id);
  if (!sanitizedQuestions.length) {
    throw new AppError(400, "Quiz has no questions configured");
  }

  const quizWindow = resolveQuizWindow(quiz, quiz.server_now);
  if (quizWindow.phase === "ended") {
    throw new AppError(410, "This quiz has already ended");
  }

  const sessionToken = uuidv4().replaceAll("-", "");
  await sessions.insertStudentSession(pool, {
    quizId: quiz.id,
    name: payload.name,
    rollNo: payload.roll_no,
    email: payload.email,
    division: payload.division,
    groupNo: payload.group_no,
    sessionToken,
  });

  return {
    session_token: sessionToken,
    ...timingPayload(quizWindow),
    quiz: {
      id: quiz.id,
      title: quiz.title,
      subject_id: quiz.subject_id,
      subject_name: quiz.subject_name,
      duration_mins: quiz.duration_mins,
      quiz_date: quiz.quiz_date,
      status: quizWindow.phase,
      scheduled_start: quizWindow.startAt.toISOString(),
      scheduled_end: quizWindow.endAt.toISOString(),
    },
    questions: sanitizedQuestions,
  };
}

export async function saveAnswers(sessionToken, answers) {
  return withTransaction(async (client) => {
    const context = buildSessionContext(
      await sessions.findSessionContextRow(client, sessionToken, { lock: true }),
    );
    if (!context) {
      throw new AppError(404, "Session not found");
    }

    const { session, quizWindow } = context;

    // Already submitted/closed: return the final result rather than saving.
    if (session.status !== "pending") {
      const breakdown = mapBreakdown(await sessions.fetchBreakdownRows(client, session.id, session.quiz_id));
      return { session_closed: true, ...submittedResultPayload(session, quizWindow, breakdown) };
    }

    assertQuizAcceptingResponses(quizWindow);

    await upsertSessionAnswers(client, session.id, answers, { isCorrect: null });
    return { message: "Progress saved", ...timingPayload(quizWindow) };
  });
}

export async function submitSession(sessionToken, { answers, submissionId = null }) {
  return withTransaction(async (client) => {
    const context = buildSessionContext(
      await sessions.findSessionContextRow(client, sessionToken, { lock: true }),
    );
    if (!context) {
      throw new AppError(404, "Session not found");
    }

    const { session, quizWindow } = context;

    if (session.status === "submitted") {
      const breakdown = mapBreakdown(await sessions.fetchBreakdownRows(client, session.id, session.quiz_id));
      return submittedResultPayload(session, quizWindow, breakdown);
    }

    assertQuizAcceptingResponses(quizWindow);

    const submittedAnswers = answers.length
      ? answers
      : await fetchStoredAnswers(client, session.id);
    const result = await finalizeSessionSubmission(client, {
      sessionId: session.id,
      quizId: session.quiz_id,
      submittedAnswers,
      submissionId,
    });

    return {
      score: result.score,
      total_points: result.total_points,
      percentage: withPercent(result.score, result.total_points),
      breakdown: result.breakdown,
      ...timingPayload(quizWindow),
    };
  });
}
