import { z } from "zod";

import { query } from "../config/db.js";

const violationTypeSchema = z.enum([
  "tab_switch",
  "window_blur",
  "screenshot_attempt",
  "copy_shortcut",
  "copy_event",
  "context_menu"
]);

const violationHeadersSchema = z.object({
  "x-session-token": z.string().trim().min(8).max(128)
});

const listViolationsQuerySchema = z.object({
  session_id: z.coerce.number().int().positive()
});

export const createViolationSchema = z.object({
  type: violationTypeSchema,
  description: z.string().trim().max(500).optional().nullable()
});

export async function createViolation(req, res, next) {
  try {
    const headerPayload = violationHeadersSchema.parse(req.headers);
    const sessionToken = headerPayload["x-session-token"];
    const payload = req.validatedBody;

    const sessionResult = await query(
      `
      SELECT id, status
      FROM student_sessions
      WHERE session_token = $1
      `,
      [sessionToken]
    );

    if (sessionResult.rowCount === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = sessionResult.rows[0];
    if (session.status !== "pending") {
      return res.status(400).json({ error: "Session is no longer active" });
    }

    await query(
      `
      INSERT INTO violation_flags (session_id, type, description)
      VALUES ($1, $2, $3)
      `,
      [session.id, payload.type, payload.description ?? null]
    );

    return res.status(201).json({ message: "Violation logged" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Missing or invalid session token header" });
    }

    return next(error);
  }
}

export async function getViolationsBySession(req, res, next) {
  try {
    const { session_id: sessionId } = listViolationsQuerySchema.parse(req.query);

    const sessionResult = await query(
      `
      SELECT
        ss.id,
        ss.quiz_id,
        ss.name,
        ss.roll_no,
        ss.email,
        ss.division,
        ss.group_no,
        ss.status,
        ss.score,
        ss.total_points,
        ss.started_at,
        ss.submitted_at
      FROM student_sessions ss
      INNER JOIN quizzes q ON q.id = ss.quiz_id
      WHERE ss.id = $1 AND q.created_by = $2
      `,
      [sessionId, req.user.userId]
    );

    if (sessionResult.rowCount === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = sessionResult.rows[0];

    const answersResult = await query(
      `
      SELECT
        qq.order_no,
        q.id AS question_id,
        q.question_text,
        q.correct_option,
        q.points,
        sa.selected_option,
        sa.is_correct,
        sa.answered_at
      FROM quiz_questions qq
      INNER JOIN questions q ON q.id = qq.question_id
      LEFT JOIN student_answers sa ON sa.session_id = $1 AND sa.question_id = q.id
      WHERE qq.quiz_id = $2
      ORDER BY qq.order_no ASC, qq.id ASC
      `,
      [sessionId, session.quiz_id]
    );

    const violationsResult = await query(
      `
      SELECT id, type, description, occurred_at
      FROM violation_flags
      WHERE session_id = $1
      ORDER BY occurred_at ASC, id ASC
      `,
      [sessionId]
    );

    const typeCounts = violationsResult.rows.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      session,
      answers: answersResult.rows,
      violations: violationsResult.rows,
      summary: {
        total_violations: violationsResult.rowCount,
        type_counts: typeCounts
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "session_id query param is required and must be a positive integer" });
    }

    return next(error);
  }
}
