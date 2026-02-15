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
    const result = await query(
      `
      SELECT id, name, created_by, created_at
      FROM subjects
      WHERE created_by = $1
      ORDER BY name ASC
      `,
      [req.user.userId]
    );

    return res.status(200).json({ subjects: result.rows });
  } catch (error) {
    return next(error);
  }
}

export async function createSubject(req, res, next) {
  try {
    const { name } = req.validatedBody;

    const result = await query(
      `
      INSERT INTO subjects (name, created_by)
      VALUES ($1, $2)
      RETURNING id, name, created_by, created_at
      `,
      [name, req.user.userId]
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

    const result = await query(
      `
      DELETE FROM subjects
      WHERE id = $1 AND created_by = $2
      RETURNING id
      `,
      [id, req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    return res.status(200).json({ message: "Subject deleted" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid subject id" });
    }

    return next(error);
  }
}
