import { randomBytes } from "node:crypto";

import { z } from "zod";

import pool, { query } from "../config/db.js";
import { transitionQuizStatus } from "../services/quizLifecycle.service.js";

const quizStatusSchema = z.enum(["draft", "active", "ended"]);

const quizMetaSchema = z.object({
  title: z.string().trim().min(1).max(255),
  subject_id: z.coerce.number().int().positive(),
  duration_mins: z.coerce.number().int().positive().optional().default(15),
  batch: z.string().trim().max(50).optional().nullable(),
  division: z.string().trim().max(10).optional().nullable(),
  group_nos: z.string().trim().max(50).optional().nullable(),
  quiz_date: z.string().date().optional().nullable(),
  scheduled_start: z.string().trim().optional().nullable(),
  scheduled_end: z.string().trim().optional().nullable(),
  access_code: z.string().trim().max(20).optional().nullable(),
  status: quizStatusSchema.optional().default("draft")
});

const questionPayloadSchema = z.object({
  question_text: z.string().trim().min(1),
  option_a: z.string().trim().min(1),
  option_b: z.string().trim().min(1),
  option_c: z.string().trim().optional().nullable(),
  option_d: z.string().trim().optional().nullable(),
  correct_option: z.enum(["a", "b", "c", "d"]),
  points: z.coerce.number().int().positive().optional().default(1),
  has_equation: z.boolean().optional().default(false),
  allow_multiple_answers: z.boolean().optional().default(false),
  is_required: z.boolean().optional().default(true)
});

export const createManualQuizSchema = quizMetaSchema.extend({
  questions: z.array(questionPayloadSchema).min(1)
});

export const autoGenerateQuizSchema = quizMetaSchema.extend({
  question_count: z.coerce.number().int().positive()
});

export const updateQuizSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    duration_mins: z.coerce.number().int().positive().optional(),
    batch: z.string().trim().max(50).optional().nullable(),
    division: z.string().trim().max(10).optional().nullable(),
    group_nos: z.string().trim().max(50).optional().nullable(),
    quiz_date: z.string().date().optional().nullable(),
    scheduled_start: z.string().trim().optional().nullable(),
    scheduled_end: z.string().trim().optional().nullable(),
    access_code: z.string().trim().max(20).optional().nullable(),
    status: quizStatusSchema.optional(),
    question_ids: z.array(z.coerce.number().int().positive()).min(1).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const updateQuizStatusSchema = z.object({
  status: z.enum(["active", "ended"])
});

const listQuizzesQuerySchema = z.object({
  search: z.string().trim().max(255).optional(),
  status: quizStatusSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10)
});

const quizIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

function normalizeNullableText(value) {
  if (value == null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

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
    status: payload.status ?? "draft"
  };
}

function generateAccessToken() {
  return randomBytes(8).toString("hex");
}

function escapeCsvValue(value) {
  if (value == null) {
    return "";
  }

  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function toCsv(rows, headers) {
  const headerLine = headers.join(",");
  const lines = rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(","));
  return [headerLine, ...lines].join("\n");
}

async function assertSubjectOwnership(subjectId, userId) {
  const subject = await query(
    `
    SELECT id
    FROM subjects
    WHERE id = $1 AND created_by = $2
    `,
    [subjectId, userId]
  );

  return subject.rowCount > 0;
}

async function assertQuizOwnership(quizId, userId, dbClient = query) {
  const result = await dbClient(
    `
    SELECT id, title, status, access_token
    FROM quizzes
    WHERE id = $1 AND created_by = $2
    `,
    [quizId, userId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0];
}

export async function listQuizzes(req, res, next) {
  try {
    const { search, status, page, limit } = listQuizzesQuerySchema.parse(req.query);
    const offset = (page - 1) * limit;

    const result = await query(
      `
      SELECT
        q.id,
        q.title,
        q.subject_id,
        s.name AS subject_name,
        q.duration_mins,
        q.batch,
        q.division,
        q.group_nos,
        q.status,
        q.quiz_date,
        q.scheduled_start,
        q.scheduled_end,
        q.access_code,
        q.access_token,
        q.created_at,
        COUNT(*) OVER()::int AS total_count
      FROM quizzes q
      LEFT JOIN subjects s ON s.id = q.subject_id
      WHERE q.created_by = $1
        AND ($2::text IS NULL OR q.status = $2)
        AND (
          $3::text IS NULL
          OR q.title ILIKE '%' || $3 || '%'
          OR COALESCE(s.name, '') ILIKE '%' || $3 || '%'
        )
      ORDER BY q.created_at DESC, q.id DESC
      LIMIT $4 OFFSET $5
      `,
      [req.user.userId, status ?? null, search || null, limit, offset]
    );

    const total = result.rows[0]?.total_count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      data: result.rows,
      quizzes: result.rows,
      total,
      count: total,
      page,
      totalPages
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid query params for quizzes list" });
    }

    return next(error);
  }
}

export async function createManualQuiz(req, res, next) {
  const client = await pool.connect();

  try {
    const payload = req.validatedBody;
    const metadata = normalizeQuizMeta(payload, req.user.userId);

    const isOwned = await assertSubjectOwnership(metadata.subject_id, req.user.userId);
    if (!isOwned) {
      return res.status(404).json({ error: "Subject not found" });
    }

    await client.query("BEGIN");

    const quizResult = await client.query(
      `
      INSERT INTO quizzes (
        title, subject_id, created_by, duration_mins, batch, division, group_nos, status,
        quiz_date, scheduled_start, scheduled_end, access_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, title, subject_id, duration_mins, batch, division, group_nos, status, quiz_date,
                scheduled_start, scheduled_end, access_code, access_token, created_at
      `,
      [
        metadata.title,
        metadata.subject_id,
        metadata.created_by,
        metadata.duration_mins,
        metadata.batch,
        metadata.division,
        metadata.group_nos,
        metadata.status,
        metadata.quiz_date,
        metadata.scheduled_start,
        metadata.scheduled_end,
        metadata.access_code
      ]
    );

    const quiz = quizResult.rows[0];
    const insertedQuestions = [];

    for (let index = 0; index < payload.questions.length; index += 1) {
      const item = payload.questions[index];

      const questionResult = await client.query(
        `
        INSERT INTO questions (
          subject_id, question_text, option_a, option_b, option_c, option_d,
          correct_option, has_equation, allow_multiple_answers, points, is_required, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, subject_id, question_text, option_a, option_b, option_c, option_d,
                  correct_option, has_equation, allow_multiple_answers, points, is_required,
                  created_by, created_at
        `,
        [
          metadata.subject_id,
          item.question_text,
          item.option_a,
          item.option_b,
          item.option_c ?? null,
          item.option_d ?? null,
          item.correct_option,
          item.has_equation,
          item.allow_multiple_answers,
          item.points,
          item.is_required,
          req.user.userId
        ]
      );

      const question = questionResult.rows[0];
      insertedQuestions.push(question);

      await client.query(
        `
        INSERT INTO quiz_questions (quiz_id, question_id, order_no)
        VALUES ($1, $2, $3)
        `,
        [quiz.id, question.id, index + 1]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      quiz,
      questions: insertedQuestions
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failures
    }
    return next(error);
  } finally {
    client.release();
  }
}

export async function autoGenerateQuiz(req, res, next) {
  const client = await pool.connect();

  try {
    const payload = req.validatedBody;
    const metadata = normalizeQuizMeta(payload, req.user.userId);

    const isOwned = await assertSubjectOwnership(metadata.subject_id, req.user.userId);
    if (!isOwned) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const availableQuestions = await client.query(
      `
      SELECT id
      FROM questions
      WHERE subject_id = $1 AND created_by = $2
      ORDER BY RANDOM()
      LIMIT $3
      `,
      [metadata.subject_id, req.user.userId, payload.question_count]
    );

    if (availableQuestions.rowCount < payload.question_count) {
      return res.status(400).json({
        error: `Not enough questions in subject. Requested ${payload.question_count}, found ${availableQuestions.rowCount}`
      });
    }

    await client.query("BEGIN");

    const quizResult = await client.query(
      `
      INSERT INTO quizzes (
        title, subject_id, created_by, duration_mins, batch, division, group_nos, status,
        quiz_date, scheduled_start, scheduled_end, access_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, title, subject_id, duration_mins, batch, division, group_nos, status, quiz_date,
                scheduled_start, scheduled_end, access_code, access_token, created_at
      `,
      [
        metadata.title,
        metadata.subject_id,
        metadata.created_by,
        metadata.duration_mins,
        metadata.batch,
        metadata.division,
        metadata.group_nos,
        metadata.status,
        metadata.quiz_date,
        metadata.scheduled_start,
        metadata.scheduled_end,
        metadata.access_code
      ]
    );

    const quiz = quizResult.rows[0];

    for (let index = 0; index < availableQuestions.rows.length; index += 1) {
      const item = availableQuestions.rows[index];
      await client.query(
        `
        INSERT INTO quiz_questions (quiz_id, question_id, order_no)
        VALUES ($1, $2, $3)
        `,
        [quiz.id, item.id, index + 1]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      quiz,
      question_count: availableQuestions.rowCount
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failures
    }
    return next(error);
  } finally {
    client.release();
  }
}

export async function getQuizById(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);

    const quizResult = await query(
      `
      SELECT id, title, subject_id, created_by, duration_mins, batch, division, group_nos,
             status, quiz_date, scheduled_start, scheduled_end, access_code, access_token, created_at
      FROM quizzes
      WHERE id = $1 AND created_by = $2
      `,
      [id, req.user.userId]
    );

    if (quizResult.rowCount === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const questionResult = await query(
      `
      SELECT q.id, q.subject_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
             q.correct_option, q.has_equation, q.allow_multiple_answers, q.points, q.is_required,
             qq.order_no
      FROM quiz_questions qq
      INNER JOIN questions q ON q.id = qq.question_id
      WHERE qq.quiz_id = $1
      ORDER BY qq.order_no ASC, qq.id ASC
      `,
      [id]
    );

    return res.status(200).json({
      quiz: quizResult.rows[0],
      questions: questionResult.rows
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }

    return next(error);
  }
}

export async function updateQuiz(req, res, next) {
  const client = await pool.connect();

  try {
    const { id } = quizIdParamSchema.parse(req.params);
    const payload = req.validatedBody;

    const existing = await assertQuizOwnership(id, req.user.userId, client.query.bind(client));
    if (!existing) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    let nextAccessToken = existing.access_token;
    if (payload.status === "active" && !nextAccessToken) {
      nextAccessToken = generateAccessToken();
    }

    const updates = [];
    const values = [];
    let position = 1;

    const fields = [
      "title",
      "duration_mins",
      "batch",
      "division",
      "group_nos",
      "status",
      "quiz_date",
      "scheduled_start",
      "scheduled_end",
      "access_code"
    ];

    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        updates.push(`${field} = $${position}`);
        values.push(
          ["batch", "division", "group_nos", "scheduled_start", "scheduled_end", "access_code"].includes(field)
            ? normalizeNullableText(payload[field])
            : payload[field]
        );
        position += 1;
      }
    }

    if (nextAccessToken !== existing.access_token) {
      updates.push(`access_token = $${position}`);
      values.push(nextAccessToken);
      position += 1;
    }

    const reorderRequested = Array.isArray(payload.question_ids);
    let reorderedQuestionIds = null;

    if (reorderRequested) {
      const existingQuestionRows = await client.query(
        `
        SELECT question_id
        FROM quiz_questions
        WHERE quiz_id = $1
        ORDER BY order_no ASC, id ASC
        `,
        [id]
      );

      const existingIds = existingQuestionRows.rows.map((row) => Number(row.question_id));
      const requestedIds = payload.question_ids.map((item) => Number(item));
      const existingSorted = [...existingIds].sort((a, b) => a - b);
      const requestedSorted = [...requestedIds].sort((a, b) => a - b);
      const valid =
        existingIds.length === requestedIds.length &&
        existingSorted.every((item, index) => item === requestedSorted[index]);

      if (!valid) {
        return res.status(400).json({ error: "question_ids must match current quiz question ids exactly" });
      }

      reorderedQuestionIds = requestedIds;
    }

    if (updates.length === 0 && !reorderRequested) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await client.query("BEGIN");

    if (reorderedQuestionIds) {
      for (let index = 0; index < reorderedQuestionIds.length; index += 1) {
        await client.query(
          `
          UPDATE quiz_questions
          SET order_no = $1
          WHERE quiz_id = $2 AND question_id = $3
          `,
          [index + 1, id, reorderedQuestionIds[index]]
        );
      }
    }

    if (updates.length > 0) {
      values.push(id, req.user.userId);
      await client.query(
        `
        UPDATE quizzes
        SET ${updates.join(", ")}
        WHERE id = $${position} AND created_by = $${position + 1}
        `,
        values
      );
    }

    const result = await client.query(
      `
      SELECT id, title, subject_id, created_by, duration_mins, batch, division, group_nos,
             status, quiz_date, scheduled_start, scheduled_end, access_code, access_token, created_at
      FROM quizzes
      WHERE id = $1 AND created_by = $2
      `,
      [id, req.user.userId]
    );

    await client.query("COMMIT");

    const updatedQuiz = result.rows[0];
    return res.status(200).json({
      quiz: updatedQuiz,
      share_url: updatedQuiz.access_token ? `${process.env.CLIENT_URL}/quiz/enter/${updatedQuiz.access_token}` : null
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failures
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input for quiz update" });
    }

    return next(error);
  } finally {
    client.release();
  }
}

export async function updateQuizStatus(req, res, next) {
  const client = await pool.connect();

  try {
    const { id } = quizIdParamSchema.parse(req.params);
    const { status } = req.validatedBody;

    const ownedQuiz = await assertQuizOwnership(id, req.user.userId, client.query.bind(client));
    if (!ownedQuiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    await client.query("BEGIN");
    const transitionResult = await transitionQuizStatus(client, {
      quizId: id,
      nextStatus: status,
      enforceTransition: true
    });

    if (transitionResult?.error) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: transitionResult.error });
    }

    await client.query("COMMIT");

    return res.status(200).json({
      quiz: transitionResult.quiz,
      auto_submitted_count: transitionResult.auto_submitted_count,
      share_url: transitionResult.quiz?.access_token
        ? `${process.env.CLIENT_URL}/quiz/enter/${transitionResult.quiz.access_token}`
        : null
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failures
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id or status" });
    }

    return next(error);
  } finally {
    client.release();
  }
}

export async function deleteQuiz(req, res, next) {
  const client = await pool.connect();

  try {
    const { id } = quizIdParamSchema.parse(req.params);

    const owned = await assertQuizOwnership(id, req.user.userId, client.query.bind(client));
    if (!owned) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    await client.query("BEGIN");

    await client.query(
      `DELETE FROM violation_flags WHERE session_id IN (SELECT id FROM student_sessions WHERE quiz_id = $1)`,
      [id]
    );
    await client.query(
      `DELETE FROM student_answers WHERE session_id IN (SELECT id FROM student_sessions WHERE quiz_id = $1)`,
      [id]
    );
    await client.query("DELETE FROM student_sessions WHERE quiz_id = $1", [id]);
    await client.query("DELETE FROM quizzes WHERE id = $1 AND created_by = $2", [id, req.user.userId]);

    await client.query("COMMIT");

    return res.status(200).json({ message: "Quiz deleted" });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }
    return next(error);
  } finally {
    client.release();
  }
}

export async function getQuizLiveStats(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);

    const quizResult = await query(
      `
      SELECT
        q.id,
        q.title,
        q.subject_id,
        s.name AS subject_name,
        q.batch,
        q.division,
        q.group_nos,
        q.quiz_date,
        q.status,
        q.access_code,
        q.access_token,
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

    const statsResult = await query(
      `
      SELECT
        COUNT(*)::int AS total_entered,
        COUNT(*) FILTER (WHERE status = 'submitted')::int AS submitted,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
      FROM student_sessions
      WHERE quiz_id = $1
      `,
      [id]
    );

    const flaggedResult = await query(
      `
      SELECT COUNT(DISTINCT ss.id)::int AS flagged
      FROM student_sessions ss
      INNER JOIN violation_flags vf ON vf.session_id = ss.id
      WHERE ss.quiz_id = $1
      `,
      [id]
    );

    const elapsedResult = await query(
      `
      SELECT EXTRACT(EPOCH FROM (NOW() - COALESCE(MIN(started_at), $2::timestamp)))::int AS elapsed_seconds
      FROM student_sessions
      WHERE quiz_id = $1
      `,
      [id, quizResult.rows[0].created_at]
    );

    return res.status(200).json({
      quiz: quizResult.rows[0],
      stats: {
        total_entered: Number(statsResult.rows[0]?.total_entered || 0),
        submitted: Number(statsResult.rows[0]?.submitted || 0),
        pending: Number(statsResult.rows[0]?.pending || 0),
        flagged: Number(flaggedResult.rows[0]?.flagged || 0),
        elapsed_seconds: Math.max(0, Number(elapsedResult.rows[0]?.elapsed_seconds || 0))
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }

    return next(error);
  }
}

export async function getQuizPreview(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);

    const quizResult = await query(
      `
      SELECT id, title, subject_id, duration_mins, batch, division, group_nos, quiz_date, status, access_token
      FROM quizzes
      WHERE id = $1 AND created_by = $2
      `,
      [id, req.user.userId]
    );

    if (quizResult.rowCount === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const questionResult = await query(
      `
      SELECT
        q.id,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_option,
        q.has_equation,
        q.points,
        qq.order_no
      FROM quiz_questions qq
      INNER JOIN questions q ON q.id = qq.question_id
      WHERE qq.quiz_id = $1
      ORDER BY qq.order_no ASC, qq.id ASC
      `,
      [id]
    );

    return res.status(200).json({
      quiz: quizResult.rows[0],
      questions: questionResult.rows
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }

    return next(error);
  }
}

export async function exportQuizResponses(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);

    const quizResult = await query(
      `
      SELECT id, title, status
      FROM quizzes
      WHERE id = $1 AND created_by = $2
      `,
      [id, req.user.userId]
    );

    if (quizResult.rowCount === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const summaryRowsResult = await query(
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
        COUNT(vf.id)::int AS violation_count
      FROM student_sessions ss
      LEFT JOIN violation_flags vf ON vf.session_id = ss.id
      WHERE ss.quiz_id = $1
      GROUP BY ss.id
      ORDER BY ss.started_at DESC, ss.id DESC
      `,
      [id]
    );

    const answerRowsResult = await query(
      `
      SELECT
        ss.id AS session_id,
        ss.name,
        ss.roll_no,
        qq.order_no,
        q.question_text,
        sa.selected_option,
        q.correct_option,
        sa.is_correct
      FROM student_sessions ss
      INNER JOIN quiz_questions qq ON qq.quiz_id = ss.quiz_id
      INNER JOIN questions q ON q.id = qq.question_id
      LEFT JOIN student_answers sa ON sa.session_id = ss.id AND sa.question_id = q.id
      WHERE ss.quiz_id = $1
      ORDER BY ss.id ASC, qq.order_no ASC
      `,
      [id]
    );

    const safeTitle = quizResult.rows[0].title.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 50) || "quiz";
    const summaryRows = summaryRowsResult.rows.map((row) => ({
      session_id: row.session_id,
      student_name: row.name,
      roll_no: row.roll_no,
      email: row.email,
      division: row.division,
      group_no: row.group_no,
      status: row.status,
      score: row.score,
      total_points: row.total_points,
      started_at: row.started_at,
      submitted_at: row.submitted_at,
      violation_count: row.violation_count
    }));

    const answerRows = answerRowsResult.rows.map((row) => ({
      session_id: row.session_id,
      student_name: row.name,
      roll_no: row.roll_no,
      question_no: row.order_no,
      question_text: row.question_text,
      selected_option: row.selected_option ? String(row.selected_option).toUpperCase() : "",
      correct_option: row.correct_option ? String(row.correct_option).toUpperCase() : "",
      is_correct: row.is_correct
    }));

    try {
      const XLSX = await import("xlsx");
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      const answersSheet = XLSX.utils.json_to_sheet(answerRows);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      XLSX.utils.book_append_sheet(workbook, answersSheet, "Answers");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=\"${safeTitle}_results.xlsx\"`);
      return res.status(200).send(buffer);
    } catch {
      const summaryCsv = toCsv(summaryRows, [
        "session_id",
        "student_name",
        "roll_no",
        "email",
        "division",
        "group_no",
        "status",
        "score",
        "total_points",
        "started_at",
        "submitted_at",
        "violation_count"
      ]);

      const answersCsv = toCsv(answerRows, [
        "session_id",
        "student_name",
        "roll_no",
        "question_no",
        "question_text",
        "selected_option",
        "correct_option",
        "is_correct"
      ]);

      const csvPayload = [`Summary`, summaryCsv, "", `Answers`, answersCsv].join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=\"${safeTitle}_results.csv\"`);
      return res.status(200).send(csvPayload);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }

    return next(error);
  }
}

export async function duplicateQuiz(req, res, next) {
  const client = await pool.connect();

  try {
    const { id } = quizIdParamSchema.parse(req.params);

    const sourceQuizResult = await client.query(
      `
      SELECT
        id,
        title,
        subject_id,
        created_by,
        duration_mins,
        batch,
        division,
        group_nos,
        quiz_date,
        scheduled_start,
        scheduled_end,
        access_code
      FROM quizzes
      WHERE id = $1 AND created_by = $2
      `,
      [id, req.user.userId]
    );

    if (sourceQuizResult.rowCount === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const sourceQuiz = sourceQuizResult.rows[0];
    const copiedTitle = `Copy of ${sourceQuiz.title}`.slice(0, 255);

    await client.query("BEGIN");

    const insertQuizResult = await client.query(
      `
      INSERT INTO quizzes (
        title, subject_id, created_by, duration_mins, batch, division, group_nos, status,
        quiz_date, scheduled_start, scheduled_end, access_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, $9, $10, $11)
      RETURNING id
      `,
      [
        copiedTitle,
        sourceQuiz.subject_id,
        sourceQuiz.created_by,
        sourceQuiz.duration_mins,
        sourceQuiz.batch,
        sourceQuiz.division,
        sourceQuiz.group_nos,
        sourceQuiz.quiz_date,
        sourceQuiz.scheduled_start,
        sourceQuiz.scheduled_end,
        sourceQuiz.access_code
      ]
    );

    const newQuizId = insertQuizResult.rows[0].id;

    await client.query(
      `
      INSERT INTO quiz_questions (quiz_id, question_id, order_no)
      SELECT $1, question_id, order_no
      FROM quiz_questions
      WHERE quiz_id = $2
      ORDER BY order_no ASC, id ASC
      `,
      [newQuizId, id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      quiz_id: newQuizId
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failures
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }

    return next(error);
  } finally {
    client.release();
  }
}

export async function getQuizLeaderboard(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);
    const quiz = await assertQuizOwnership(id, req.user.userId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const result = await query(
      `
      SELECT
        id AS session_id,
        name,
        roll_no,
        score,
        total_points,
        EXTRACT(EPOCH FROM (submitted_at - started_at))::int AS time_taken_secs
      FROM student_sessions
      WHERE quiz_id = $1 AND status = 'submitted'
      ORDER BY score DESC NULLS LAST, time_taken_secs ASC NULLS LAST, submitted_at ASC NULLS LAST
      LIMIT 10
      `,
      [id]
    );

    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      session_id: row.session_id,
      name: row.name,
      roll_no: row.roll_no,
      score: row.score,
      total_points: row.total_points,
      time_taken_secs: row.time_taken_secs
    }));

    return res.status(200).json({ leaderboard });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }

    return next(error);
  }
}
