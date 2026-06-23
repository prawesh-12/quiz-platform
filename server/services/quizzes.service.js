import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { readPositiveIntegerEnv } from "../utils/env.js";
import { getCachedJson } from "./cache.service.js";
import { resolveQuizWindow } from "./quizTiming.service.js";
import * as quizzes from "../repositories/quizzes.repository.js";

// Teacher-monitoring views over a quiz's live exam data. Quiz metadata comes from the
// local quizzes read-model; participation/scores come from the exam tables.

// Short-TTL cache so multiple teachers polling the same quiz don't each re-run the
// aggregates. Keyed by quiz + owner.
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
