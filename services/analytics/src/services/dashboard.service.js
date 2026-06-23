import pool from "../config/db.js";
import * as dashboard from "../repositories/dashboard.repository.js";

const TREND_MAX_DAYS = 366;
const DEFAULT_TREND_DAYS = 29;
const END_HOUR = 23;
const END_MINUTE = 59;
const END_SECOND = 59;
const END_MS = 999;

function toNumberOrNull(value) {
  if (value == null) {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function buildStatusCounts(rows) {
  const counts = { scheduled: 0, active: 0, ended: 0, draft: 0, total: 0 };
  for (const row of rows) {
    const status = row.status || "unknown";
    const count = Number(row.count) || 0;
    counts[status] = (counts[status] || 0) + count;
    counts.total += count;
  }
  return counts;
}

function mapQuizRow(row) {
  return {
    quiz_id: row.quiz_id,
    quiz_title: row.quiz_title,
    subject_id: row.subject_id,
    subject_name: row.subject_name || "Unassigned",
    status: row.status,
    quiz_date: row.quiz_date,
    created_at: row.created_at,
    attempts: Number(row.attempts || 0),
    participants: Number(row.participants || 0),
    avg_score_percent: toNumberOrNull(row.avg_score_percent),
    avg_time_seconds: toNumberOrNull(row.avg_time_seconds)
  };
}

// One payload powering every dashboard KPI/table.
export async function getDashboardSummary({ createdBy = null } = {}) {
  const [statusRows, kpis, perQuiz, perSubject] = await Promise.all([
    dashboard.findStatusCounts(pool, createdBy),
    dashboard.findKpis(pool, createdBy),
    dashboard.findPerQuizStats(pool, createdBy),
    dashboard.findPerSubjectStats(pool, createdBy)
  ]);

  return {
    counts: buildStatusCounts(statusRows),
    kpis: {
      total_participants: Number(kpis?.total_participants || 0),
      attempts_today: Number(kpis?.attempts_today || 0),
      new_participants_today: Number(kpis?.new_participants_today || 0),
      flagged_sessions: Number(kpis?.flagged_sessions || 0)
    },
    quizzes: perQuiz.map(mapQuizRow),
    subjects: perSubject.map((row) => ({
      subject_id: row.subject_id,
      subject_name: row.subject_name,
      participants: Number(row.participants || 0),
      avg_score_percent: toNumberOrNull(row.avg_score_percent)
    })),
    generated_at: new Date().toISOString()
  };
}

function resolveEnd(end) {
  const endDate = end ? new Date(end) : null;
  return endDate && !Number.isNaN(endDate.getTime()) ? endDate : new Date();
}

function resolveStart(start, validEnd) {
  const defaultStart = new Date(validEnd);
  defaultStart.setDate(defaultStart.getDate() - DEFAULT_TREND_DAYS);

  const startDate = start ? new Date(start) : null;
  let validStart =
    startDate && !Number.isNaN(startDate.getTime()) ? startDate : defaultStart;

  if (validStart > validEnd) {
    validStart = defaultStart;
  }

  // Bound the window so a crafted range cannot scan an unbounded span.
  const maxStart = new Date(validEnd);
  maxStart.setDate(maxStart.getDate() - TREND_MAX_DAYS);
  if (validStart < maxStart) {
    validStart = maxStart;
  }
  return validStart;
}

function clampTrendRange(start, end) {
  const validEnd = resolveEnd(end);
  const validStart = resolveStart(start, validEnd);

  // Query end is exclusive; include the whole end day.
  const queryEnd = new Date(validEnd);
  queryEnd.setHours(END_HOUR, END_MINUTE, END_SECOND, END_MS);

  return { startAt: validStart, endAt: queryEnd };
}

// Sparse {day -> participants}; the client builds the continuous date axis.
export async function getParticipantTrend({ createdBy = null, start, end } = {}) {
  const { startAt, endAt } = clampTrendRange(start, end);
  const rows = await dashboard.findParticipantTrend(pool, createdBy, startAt, endAt);
  return {
    start: startAt.toISOString(),
    end: endAt.toISOString(),
    points: rows.map((row) => ({
      day: row.day,
      participants: Number(row.participants || 0)
    }))
  };
}
