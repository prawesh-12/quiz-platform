import { z } from "zod";
import { query } from "../config/db.js";

const unitInputSchema = z.object({
  name: z.string().trim().min(1).max(150),
});

const unitIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const subjectIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

async function assertSubjectOwnership(subjectId, userId) {
  const result =
    userId?.role === "admin"
      ? await query(`SELECT id FROM subjects WHERE id = $1`, [subjectId])
      : await query(
          `
          SELECT s.id FROM subjects s
          LEFT JOIN teacher_subjects ts ON ts.subject_id = s.id AND ts.teacher_id = $2
          WHERE s.id = $1 AND (s.created_by = $2 OR ts.teacher_id = $2)
          `,
          [subjectId, userId?.id],
        );
  return result.rowCount > 0;
}

async function assertUnitOwnership(unitId, userId) {
  const result =
    userId?.role === "admin"
      ? await query(
          `
          SELECT u.id
          FROM units u
          WHERE u.id = $1
          `,
          [unitId],
        )
      : await query(
          `
          SELECT u.id
          FROM units u
          JOIN subjects s ON s.id = u.subject_id
          LEFT JOIN teacher_subjects ts ON ts.subject_id = s.id AND ts.teacher_id = $2
          WHERE u.id = $1 AND (s.created_by = $2 OR ts.teacher_id = $2)
          `,
          [unitId, userId?.id],
        );
  return result.rowCount > 0;
}

function getRequester(req) {
  return {
    id: req.user.userId ?? req.user.id,
    role: req.user.role,
  };
}

export async function listUnitsBySubject(req, res, next) {
  try {
    const { id: subjectId } = subjectIdParamSchema.parse(req.params);
    const requester = getRequester(req);

    const isOwned = await assertSubjectOwnership(subjectId, requester);
    if (!isOwned) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const result =
      requester.role === "admin"
        ? await query(
            `
            SELECT u.id, u.name, u.order_no, u.created_at,
                   COUNT(q.id)::int AS question_count
            FROM units u
            LEFT JOIN questions q ON q.unit_id = u.id AND q.in_subject_bank = TRUE
            WHERE u.subject_id = $1
            GROUP BY u.id
            ORDER BY u.order_no ASC, u.created_at ASC
            `,
            [subjectId],
          )
        : await query(
            `
            SELECT u.id, u.name, u.order_no, u.created_at,
                   COUNT(q.id)::int AS question_count
            FROM units u
            LEFT JOIN questions q
              ON q.unit_id = u.id
             AND q.in_subject_bank = TRUE
             AND q.subject_id = $1
            WHERE u.subject_id = $1
            GROUP BY u.id
            ORDER BY u.order_no ASC, u.created_at ASC
            `,
            [subjectId],
          );

    return res.json({ units: result.rows });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid subject ID" });
    }
    next(error);
  }
}

export async function createUnit(req, res, next) {
  try {
    const { id: subjectId } = subjectIdParamSchema.parse(req.params);
    const { name } = unitInputSchema.parse(req.body);
    const requester = getRequester(req);

    const isOwned = await assertSubjectOwnership(subjectId, requester);
    if (!isOwned) {
      return res.status(404).json({ error: "Subject not found" });
    }

    // Check for duplicate name in this subject
    const existing = await query(
      `SELECT id FROM units WHERE subject_id = $1 AND name = $2`,
      [subjectId, name],
    );
    if (existing.rowCount > 0) {
      return res
        .status(400)
        .json({ error: "Unit with this name already exists in the subject" });
    }

    // Get max order_no
    const maxOrder = await query(
      `SELECT MAX(order_no) as max_order FROM units WHERE subject_id = $1`,
      [subjectId],
    );
    const nextOrder = (maxOrder.rows[0].max_order || 0) + 1;

    const result = await query(
      `
      INSERT INTO units (subject_id, name, order_no, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, order_no, created_at
      `,
      [
        subjectId,
        name,
        nextOrder,
        requester.role === "admin" ? null : requester.id,
      ],
    );

    return res.status(201).json({ unit: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input" });
    }
    next(error);
  }
}

export async function updateUnit(req, res, next) {
  try {
    const { id } = unitIdParamSchema.parse(req.params);
    const { name } = unitInputSchema.parse(req.body);
    const requester = getRequester(req);

    const isOwned = await assertUnitOwnership(id, requester);
    if (!isOwned) {
      return res.status(404).json({ error: "Unit not found" });
    }

    // Check uniqueness constraint excluding current unit
    // We need subject_id for this check, fetch it first or do it in one query if possible
    // Simpler to just try catch unique constraint violation from DB, but manual check is friendlier
    const unitInfo = await query(`SELECT subject_id FROM units WHERE id = $1`, [
      id,
    ]);
    const subjectId = unitInfo.rows[0].subject_id;

    const existing = await query(
      `SELECT id FROM units WHERE subject_id = $1 AND name = $2 AND id != $3`,
      [subjectId, name, id],
    );
    if (existing.rowCount > 0) {
      return res
        .status(400)
        .json({ error: "Unit with this name already exists in the subject" });
    }

    const result = await query(
      `
      UPDATE units
      SET name = $1
      WHERE id = $2
      RETURNING id, name, order_no, created_at
      `,
      [name, id],
    );

    return res.json({ unit: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input" });
    }
    next(error);
  }
}

export async function deleteUnit(req, res, next) {
  try {
    const { id } = unitIdParamSchema.parse(req.params);
    const requester = getRequester(req);

    const isOwned = await assertUnitOwnership(id, requester);
    if (!isOwned) {
      return res.status(404).json({ error: "Unit not found" });
    }

    // Questions will reference units with ON DELETE SET NULL as per schema change.
    // Also we need to set in_subject_bank = FALSE for questions in this unit?
    // The plan says: "Server sets unit_id = NULL and in_subject_bank = FALSE on all questions that belonged to that unit"
    // Postgres ON DELETE SET NULL only handles unit_id. We need to manually update in_subject_bank.

    await query("BEGIN");

    await query(
      `
      UPDATE questions
      SET in_subject_bank = FALSE, unit_id = NULL
      WHERE unit_id = $1
      `,
      [id],
    );

    await query(`DELETE FROM units WHERE id = $1`, [id]);

    await query("COMMIT");

    return res.json({ message: "Unit deleted" });
  } catch (error) {
    await query("ROLLBACK");
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid unit ID" });
    }
    next(error);
  }
}

export async function getUnitQuestions(req, res, next) {
  try {
    const { id } = unitIdParamSchema.parse(req.params);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const requester = getRequester(req);

    const isOwned = await assertUnitOwnership(id, requester);
    if (!isOwned) {
      return res.status(404).json({ error: "Unit not found" });
    }

    const result = await query(
      `
      SELECT id, subject_id, question_text, option_a, option_b, option_c, option_d,
             correct_option, has_equation, allow_multiple_answers, points, is_required,
             created_by, created_at, unit_id, in_subject_bank,
             COUNT(*) OVER()::int AS total_count
      FROM questions
      WHERE unit_id = $1 AND in_subject_bank = TRUE
      ORDER BY created_at ASC
      LIMIT $2 OFFSET $3
      `,
      [id, limit, offset],
    );

    const total = result.rows[0]?.total_count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.json({
      questions: result.rows,
      page,
      totalPages,
      total,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid unit ID" });
    }
    next(error);
  }
}
