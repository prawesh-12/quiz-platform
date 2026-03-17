import { z } from "zod";

import { query } from "../config/db.js";

export const createSubjectSchema = z.object({
  name: z.string().trim().min(2).max(100)
});

const subjectIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export async function listSubjects(req, res, next) {
  try {
    const requesterId = req.user.userId ?? req.user.id;
    const requesterRole = req.user.role;

    const result =
      requesterRole === "admin"
        ? await query(
            `
            SELECT id, name, created_by, created_at
            FROM subjects
            ORDER BY name ASC
            `
          )
        : await query(
            `
            SELECT DISTINCT s.id, s.name, s.created_by, s.created_at
            FROM subjects s
            JOIN teacher_subjects ts ON ts.subject_id = s.id AND ts.teacher_id = $1
            ORDER BY s.name ASC
            `,
            [requesterId]
          );

    return res.status(200).json({ subjects: result.rows });

  } catch (error) {
    return next(error);
  }
}

export async function createSubject(req, res, next) {
  try {
    const { name } = req.validatedBody;
    const requesterId = req.user.userId ?? req.user.id;
    const createdBy = req.user.role === "admin" ? null : requesterId;

    const result = await query(
      `
      INSERT INTO subjects (name, created_by)
      VALUES ($1, $2)
      RETURNING id, name, created_by, created_at
      `,
      [name, createdBy]
    );

    return res.status(201).json({ subject: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "A subject with this name already exists" });
    }

    return next(error);
  }
}

export async function deleteSubject(req, res, next) {
  try {
    const { id } = subjectIdParamSchema.parse(req.params);
    const requesterId = req.user.userId ?? req.user.id;

    const result =
      req.user.role === "admin"
        ? await query(
            `
            DELETE FROM subjects
            WHERE id = $1
            RETURNING id
            `,
            [id]
          )
        : await query(
            `
            DELETE FROM subjects
            WHERE id = $1 AND created_by = $2
            RETURNING id
            `,
            [id, requesterId]
          );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    return res.status(200).json({ message: "Subject deleted" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid subject id" });
    }
    if (error?.code === "23503") {
      return res.status(409).json({ error: "Cannot delete subject while quizzes still reference it" });
    }

    return next(error);
  }
}

async function assertSubjectOwnership(subjectId, userId, role) {
  const result =
    role === "admin"
      ? await query(`SELECT id FROM subjects WHERE id = $1`, [subjectId])
      : await query(`SELECT id FROM subjects WHERE id = $1 AND created_by = $2`, [subjectId, userId]);
  return result.rowCount > 0;
}

export async function getQuizHistoryBySubject(req, res, next) {
    try {
        const { id } = subjectIdParamSchema.parse(req.params);
        const requesterId = req.user.userId ?? req.user.id;
        const requesterRole = req.user.role;

        const isOwned = await assertSubjectOwnership(id, requesterId, requesterRole);
        if (!isOwned) {
            return res.status(404).json({ error: "Subject not found" });
        }

        // Fetch quizzes with their questions
        // Grouping might be better done in JS if we want a nested structure,
        // or we can just fetch quizzes and then fetch questions (N+1 but simple)
        // or separate queries.
        // The plan says: "Returns all quizzes for the subject, each with their associated questions"
        // Let's do a join query and organize in JS.

        const result = await query(`
            SELECT 
                qz.id as quiz_id, qz.title, qz.quiz_date, qz.status, qz.created_at as quiz_created_at,
                q.id as question_id, q.question_text, q.correct_option, q.points, q.has_equation,
                q.option_a, q.option_b, q.option_c, q.option_d,
                qq.order_no
            FROM quizzes qz
            JOIN quiz_questions qq ON qq.quiz_id = qz.id
            JOIN questions q ON q.id = qq.question_id
            WHERE qz.subject_id = $1
              AND ($2::text = 'admin' OR qz.created_by = $3)
            ORDER BY qz.quiz_date DESC NULLS LAST, qz.created_at DESC, qq.order_no ASC
        `, [id, requesterRole, requesterId]);

        const quizzesMap = new Map();

        for (const row of result.rows) {
            if (!quizzesMap.has(row.quiz_id)) {
                quizzesMap.set(row.quiz_id, {
                    id: row.quiz_id,
                    title: row.title,
                    quiz_date: row.quiz_date,
                    status: row.status,
                    created_at: row.quiz_created_at,
                    questions: []
                });
            }

            if (row.question_id) {
                quizzesMap.get(row.quiz_id).questions.push({
                    id: row.question_id,
                    question_text: row.question_text,
                    correct_option: row.correct_option,
                    points: row.points,
                    has_equation: row.has_equation,
                    option_a: row.option_a,
                    option_b: row.option_b,
                    option_c: row.option_c,
                    option_d: row.option_d,
                    order_no: row.order_no
                });
            }
        }

        return res.json({ quizzes: Array.from(quizzesMap.values()) });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid subject id" });
        }
        next(error);
    }
}
