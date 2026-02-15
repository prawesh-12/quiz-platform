import { z } from "zod";

import { query } from "../config/db.js";

const quizIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

const responsesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10)
});

export async function getQuizResponses(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);
    const { page, limit } = responsesQuerySchema.parse(req.query);
    const offset = (page - 1) * limit;

    const quizResult = await query(
      `
      SELECT
        q.id,
        q.title,
        q.subject_id,
        s.name AS subject_name,
        q.duration_mins,
        q.status,
        q.quiz_date,
        q.created_at
      FROM quizzes q
      LEFT JOIN subjects s ON s.id = q.subject_id
      WHERE q.id = $1 AND q.created_by = $2
      `,
      [id, req.user.userId]
    );

    if (quizResult.rowCount === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const sessionResult = await query(
      `
      SELECT
        ss.id AS session_id,
        ss.name,
        ss.roll_no,
        ss.email,
        ss.division,
        ss.group_no,
        ss.status,
        ss.score,
        ss.total_points,
        ss.started_at,
        ss.submitted_at,
        COUNT(vf.id)::int AS total_violations,
        COUNT(*) FILTER (WHERE vf.type = 'tab_switch')::int AS tab_switch_count,
        COUNT(*) FILTER (WHERE vf.type = 'window_blur')::int AS window_blur_count,
        COUNT(*) FILTER (WHERE vf.type = 'screenshot_attempt')::int AS screenshot_attempt_count,
        COUNT(*) FILTER (WHERE vf.type = 'copy_shortcut')::int AS copy_shortcut_count,
        COUNT(*) FILTER (WHERE vf.type = 'copy_event')::int AS copy_event_count,
        COUNT(*) FILTER (WHERE vf.type = 'context_menu')::int AS context_menu_count,
        COUNT(*) OVER()::int AS total_count
      FROM student_sessions ss
      LEFT JOIN violation_flags vf ON vf.session_id = ss.id
      WHERE ss.quiz_id = $1
      GROUP BY ss.id
      ORDER BY ss.started_at DESC, ss.id DESC
      LIMIT $2 OFFSET $3
      `,
      [id, limit, offset]
    );

    const total = sessionResult.rows[0]?.total_count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const responses = sessionResult.rows.map((row) => {
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
          context_menu: Number(row.context_menu_count || 0)
        }
      };
    });

    return res.status(200).json({
      quiz: quizResult.rows[0],
      data: responses,
      responses,
      count: total,
      total,
      page,
      totalPages
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }

    return next(error);
  }
}
