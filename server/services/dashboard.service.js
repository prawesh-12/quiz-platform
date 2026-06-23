import pool from "../config/db.js";
import { readPositiveIntegerEnv } from "../utils/env.js";
import * as dashboard from "../repositories/dashboard.repository.js";
import { getCachedJson, invalidateCachePrefix } from "./cache.service.js";

const SUMMARY_TTL_MS = readPositiveIntegerEnv("DASHBOARD_SUMMARY_TTL_MS", 30000);
const TREND_TTL_MS = readPositiveIntegerEnv("DASHBOARD_TREND_TTL_MS", 60000);
const TREND_MAX_DAYS = 366;

function scopeKey(createdBy) {
  return createdBy == null ? "all" : `t:${createdBy}`;
}

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

// One cached payload powering every dashboard KPI/table without per-response fetches.
export async function getDashboardSummary({ createdBy = null } = {}) {
  return getCachedJson(`dashboard:summary:${scopeKey(createdBy)}`, SUMMARY_TTL_MS, async () => {
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
      quizzes: perQuiz.map((row) => ({
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
      })),
      subjects: perSubject.map((row) => ({
        subject_id: row.subject_id,
        subject_name: row.subject_name,
        participants: Number(row.participants || 0),
        avg_score_percent: toNumberOrNull(row.avg_score_percent)
      })),
      generated_at: new Date().toISOString()
    };
  });
}

function clampTrendRange(start, end) {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  const validEnd =
    endDate && !Number.isNaN(endDate.getTime()) ? endDate : new Date();
  const defaultStart = new Date(validEnd);
  defaultStart.setDate(defaultStart.getDate() - 29);
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

  // Query end is exclusive; include the whole end day.
  const queryEnd = new Date(validEnd);
  queryEnd.setHours(23, 59, 59, 999);

  return { startAt: validStart, endAt: queryEnd };
}

// Sparse {day -> participants}; the client builds the continuous date axis.
export async function getParticipantTrend({ createdBy = null, start, end } = {}) {
  const { startAt, endAt } = clampTrendRange(start, end);
  const key = `dashboard:trend:${scopeKey(createdBy)}:${startAt.toISOString()}:${endAt.toISOString()}`;

  return getCachedJson(key, TREND_TTL_MS, async () => {
    const rows = await dashboard.findParticipantTrend(pool, createdBy, startAt, endAt);
    return {
      start: startAt.toISOString(),
      end: endAt.toISOString(),
      points: rows.map((row) => ({
        day: row.day,
        participants: Number(row.participants || 0)
      }))
    };
  });
}

// Allow lifecycle changes (submit, status transitions) to drop stale summaries.
export async function invalidateDashboardCaches() {
  await invalidateCachePrefix("dashboard:summary:");
  await invalidateCachePrefix("dashboard:trend:");
}
