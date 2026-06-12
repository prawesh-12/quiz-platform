import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import * as responses from "../repositories/responses.repository.js";

function toResponse(row) {
  const score = row.score == null ? null : Number(row.score);
  const totalPoints = row.total_points == null ? null : Number(row.total_points);
  const scorePercent =
    score == null || !totalPoints ? null : Number(((score / totalPoints) * 100).toFixed(2));

  return {
    ...row,
    score,
    total_points: totalPoints,
    score_percent: scorePercent,
    violations: {
      tab_switch: Number(row.tab_switch_count || 0),
      window_blur: Number(row.window_blur_count || 0),
      screenshot_attempt: Number(row.screenshot_attempt_count || 0),
      copy_shortcut: Number(row.copy_shortcut_count || 0),
      copy_event: Number(row.copy_event_count || 0),
      context_menu: Number(row.context_menu_count || 0),
    },
  };
}

export async function getQuizResponses({ id, userId, page, limit }) {
  const quiz = await responses.findQuizForOwner(pool, id, userId);
  if (!quiz) {
    throw new AppError(404, "Quiz not found");
  }

  const offset = (page - 1) * limit;
  const rows = await responses.findSessionResponseRows(pool, id, limit, offset);
  const total = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const data = rows.map(toResponse);
  // Natural alphanumeric order by roll number.
  data.sort((a, b) =>
    (a.roll_no || "").localeCompare(b.roll_no || "", undefined, { numeric: true, sensitivity: "base" }),
  );

  return { quiz, data, responses: data, count: total, total, page, totalPages };
}
