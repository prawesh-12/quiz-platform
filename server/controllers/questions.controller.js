import { z } from "zod";

import { query } from "../config/db.js";

const options = ["a", "b", "c", "d"];

const questionInputSchema = z.object({
  question_text: z.string().trim().min(1),
  option_a: z.string().trim().min(1),
  option_b: z.string().trim().min(1),
  option_c: z.string().trim().optional().nullable(),
  option_d: z.string().trim().optional().nullable(),
  correct_option: z.enum(options),
  points: z.coerce.number().int().positive().optional().default(1),
  has_equation: z.boolean().optional().default(false),
  allow_multiple_answers: z.boolean().optional().default(false),
  is_required: z.boolean().optional().default(true),
  unit_id: z.coerce.number().int().positive().optional().nullable(),
  in_subject_bank: z.boolean().optional().default(false)
});

export const createQuestionSchema = questionInputSchema.extend({
  subject_id: z.coerce.number().int().positive()
});

export const bulkImportQuestionsSchema = z.object({
  subject_id: z.coerce.number().int().positive(),
  questions: z.array(questionInputSchema).min(1)
});

export const updateQuestionSchema = z
  .object({
    question_text: z.string().trim().min(1).optional(),
    option_a: z.string().trim().min(1).optional(),
    option_b: z.string().trim().min(1).optional(),
    option_c: z.string().trim().optional().nullable(),
    option_d: z.string().trim().optional().nullable(),
    correct_option: z.enum(options).optional(),
    points: z.coerce.number().int().positive().optional(),
    has_equation: z.boolean().optional(),
    allow_multiple_answers: z.boolean().optional(),
    is_required: z.boolean().optional(),
    unit_id: z.coerce.number().int().positive().optional().nullable(),
    in_subject_bank: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

const questionIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

const listQuestionsQuerySchema = z.object({
  subject_id: z.coerce.number().int().positive(),
  search: z.string().trim().max(255).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  in_subject_bank: z.enum(["true", "false"]).optional(),
  unit_id: z.coerce.number().int().optional().nullable()
});

async function assertSubjectOwnership(subjectId, userId) {
  const subject = await query(
    `
    SELECT s.id FROM subjects s
    LEFT JOIN teacher_subjects ts ON ts.subject_id = s.id AND ts.teacher_id = $2
    WHERE s.id = $1 AND (s.created_by = $2 OR ts.teacher_id = $2)
    `,
    [subjectId, userId]
  );

  return subject.rowCount > 0;
}

function mapQuestionInsertValues(payload, userId) {
  return [
    payload.subject_id,
    payload.question_text,
    payload.option_a,
    payload.option_b,
    payload.option_c ?? null,
    payload.option_d ?? null,
    payload.correct_option,
    payload.has_equation,
    payload.allow_multiple_answers,
    payload.points,
    payload.is_required,
    userId,
    payload.unit_id ?? null,
    payload.in_subject_bank ?? false
  ];
}

export async function listQuestions(req, res, next) {
  try {
    const { subject_id: subjectId, search, page, limit, in_subject_bank, unit_id: unitId } = listQuestionsQuerySchema.parse(req.query);
    const offset = (page - 1) * limit;

    const isOwned = await assertSubjectOwnership(subjectId, req.user.userId);
    if (!isOwned) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const inSubjectBankFilter = in_subject_bank === "false" ? false : true; 

    const params = [subjectId, search || null, limit, offset, inSubjectBankFilter];
    let unitFilter = "";

    if (unitId !== undefined) {
        if (unitId === null || unitId === -1) {
            unitFilter = "AND unit_id IS NULL";
        } else {
            params.push(unitId);
            unitFilter = `AND unit_id = $${params.length}`;
        }
    }

    const result = await query(
      `
      SELECT id, subject_id, question_text, option_a, option_b, option_c, option_d,
             correct_option, has_equation, allow_multiple_answers, points, is_required,
             created_by, created_at, unit_id, in_subject_bank,
             COUNT(*) OVER()::int AS total_count
      FROM questions
      WHERE subject_id = $1
        AND ($2::text IS NULL OR question_text ILIKE '%' || $2 || '%')
        AND ($5::boolean IS NULL OR in_subject_bank = $5)
        ${unitFilter}
      ORDER BY created_at DESC, id DESC
      LIMIT $3 OFFSET $4
      `,
      params
    );

    const total = result.rows[0]?.total_count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      data: result.rows,
      questions: result.rows,
      total,
      count: total,
      page,
      totalPages
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "subject_id query param is required and must be a positive integer" });
    }

    return next(error);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    const { id } = questionIdParamSchema.parse(req.params);
    const payload = req.validatedBody;

    const updates = [];
    const values = [];
    let position = 1;

    for (const [field, value] of Object.entries(payload)) {
      updates.push(`${field} = $${position}`);
      values.push(value ?? null);
      position += 1;
    }

    values.push(id, req.user.userId);

    const result = await query(
      `
      UPDATE questions
      SET ${updates.join(", ")}
      WHERE id = $${position} AND created_by = $${position + 1}
      RETURNING id, subject_id, question_text, option_a, option_b, option_c, option_d,
                correct_option, has_equation, allow_multiple_answers, points, is_required,
                created_by, created_at
      `,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    return res.status(200).json({ question: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid question id or payload" });
    }

    return next(error);
  }
}

export async function createQuestion(req, res, next) {
  try {
    const payload = req.validatedBody;

    const isOwned = await assertSubjectOwnership(payload.subject_id, req.user.userId);
    if (!isOwned) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const result = await query(
      `
      INSERT INTO questions (
        subject_id, question_text, option_a, option_b, option_c, option_d,
        correct_option, has_equation, allow_multiple_answers, points, is_required, created_by,
        unit_id, in_subject_bank
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, subject_id, question_text, option_a, option_b, option_c, option_d,
                correct_option, has_equation, allow_multiple_answers, points, is_required,
                created_by, created_at, unit_id, in_subject_bank
      `,
      mapQuestionInsertValues(payload, req.user.userId)
    );

    return res.status(201).json({ question: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function bulkImportQuestions(req, res, next) {
  try {
    const { subject_id: subjectId, questions } = req.validatedBody;

    const isOwned = await assertSubjectOwnership(subjectId, req.user.userId);
    if (!isOwned) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const inserted = [];

    for (const item of questions) {
      const result = await query(
        `
        INSERT INTO questions (
          subject_id, question_text, option_a, option_b, option_c, option_d,
          correct_option, has_equation, allow_multiple_answers, points, is_required, created_by,
          unit_id, in_subject_bank
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, subject_id, question_text, option_a, option_b, option_c, option_d,
                  correct_option, has_equation, allow_multiple_answers, points, is_required,
                  created_by, created_at, unit_id, in_subject_bank
        `,
        mapQuestionInsertValues({ ...item, subject_id: subjectId }, req.user.userId)
      );

      inserted.push(result.rows[0]);
    }

    return res.status(201).json({
      message: "Bulk question import completed",
      inserted_count: inserted.length,
      questions: inserted
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    const { id } = questionIdParamSchema.parse(req.params);

    const result = await query(
      `
      DELETE FROM questions
      WHERE id = $1 AND created_by = $2
      RETURNING id
      `,
      [id, req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    return res.status(200).json({ message: "Question deleted" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid question id" });
    }

    return next(error);
  }
}
