import bcrypt from "bcryptjs";
import { z } from "zod";

import pool, { query } from "../config/db.js";

const SALT_ROUNDS = 12;
const SCHOOL_VALUES = ["SOT", "SLS", "SOET"];
const schoolValueSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }
  return value.trim().toUpperCase();
}, z.enum(SCHOOL_VALUES));

const schoolParamSchema = z.object({
  school: schoolValueSchema
});

const teacherIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

const subjectIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

function toUniqueIds(subjectIds = []) {
  return [...new Set(subjectIds)];
}

export const addTeacherSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  password: z.string().min(8).max(128),
  school: schoolValueSchema,
  contact_no: z.string().trim().max(20).optional().nullable(),
  subject_ids: z.array(z.coerce.number().int().positive()).optional().default([])
});

export const assignSubjectsSchema = z.object({
  subject_ids: z.array(z.coerce.number().int().positive()).optional().default([])
});

function mapTeacherRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    contact_no: row.contact_no,
    school: row.school,
    created_at: row.created_at
  };
}

async function assertTeacherExists(client, teacherId) {
  const teacher = await client.query(
    `
    SELECT id
    FROM teachers
    WHERE id = $1
    `,
    [teacherId]
  );

  return teacher.rowCount > 0;
}

async function assertSubjectIdsExist(client, subjectIds) {
  if (subjectIds.length === 0) {
    return;
  }

  const result = await client.query(
    `
    SELECT id
    FROM subjects
    WHERE id = ANY($1::int[])
    `,
    [subjectIds]
  );

  if (result.rowCount !== subjectIds.length) {
    const foundIds = new Set(result.rows.map((row) => row.id));
    const missingSubjectIds = subjectIds.filter((subjectId) => !foundIds.has(subjectId));
    const error = new Error("One or more subject ids were not found");
    error.status = 404;
    error.missing_subject_ids = missingSubjectIds;
    throw error;
  }
}

export async function getAllTeachers(_req, res, next) {
  try {
    const result = await query(
      `
      SELECT
        t.id,
        t.name,
        t.email,
        t.contact_no,
        t.school,
        t.created_at
      FROM teachers t
      ORDER BY t.name ASC, t.created_at ASC
      `
    );

    return res.status(200).json({ teachers: result.rows });
  } catch (error) {
    return next(error);
  }
}

export async function removeTeacherFromSchool(req, res, next) {
  try {
    const { id: teacherId } = teacherIdParamSchema.parse(req.params);

    const result = await query(
      `UPDATE teachers SET school = NULL WHERE id = $1 RETURNING id, name, email`,
      [teacherId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    return res.status(200).json({ message: "Teacher removed from school", teacher: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid teacher id" });
    }

    return next(error);
  }
}

export async function getTeachersBySchool(req, res, next) {
  try {
    const { school } = schoolParamSchema.parse(req.params);

    const result = await query(
      `
      SELECT
        t.id,
        t.name,
        t.email,
        t.contact_no,
        t.school,
        t.created_at,
        COALESCE(
          json_agg(
            json_build_object('id', s.id, 'name', s.name)
            ORDER BY s.name
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS assigned_subjects
      FROM teachers t
      LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id
      LEFT JOIN subjects s ON s.id = ts.subject_id
      WHERE t.school = $1
      GROUP BY t.id
      ORDER BY t.name ASC, t.created_at ASC
      `,
      [school]
    );

    return res.status(200).json({ teachers: result.rows });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid school value. Use SOT, SLS, or SOET." });
    }

    return next(error);
  }
}

export async function addTeacher(req, res, next) {
  const client = await pool.connect();

  try {
    const payload = req.validatedBody;
    const normalizedEmail = payload.email.toLowerCase();
    const subjectIds = toUniqueIds(payload.subject_ids);

    const existing = await client.query(`SELECT id FROM teachers WHERE email = $1`, [normalizedEmail]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "A teacher with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);

    await client.query("BEGIN");

    await assertSubjectIdsExist(client, subjectIds);

    const teacherInsert = await client.query(
      `
      INSERT INTO teachers (name, email, password, school, contact_no, plain_password)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, school, contact_no, created_at
      `,
      [payload.name, normalizedEmail, passwordHash, payload.school, payload.contact_no ?? null, payload.password]
    );

    const teacher = mapTeacherRow(teacherInsert.rows[0]);

    if (subjectIds.length > 0) {
      await client.query(
        `
        INSERT INTO teacher_subjects (teacher_id, subject_id)
        SELECT $1, unnest($2::int[])
        ON CONFLICT (teacher_id, subject_id) DO NOTHING
        `,
        [teacher.id, subjectIds]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      teacher,
      assigned_subject_ids: subjectIds
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failures
    }

    if (error?.code === "23505") {
      return res.status(409).json({ error: "A teacher with this email already exists" });
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid add teacher payload" });
    }

    if (error?.status === 404) {
      return res.status(404).json({
        error: error.message,
        missing_subject_ids: error.missing_subject_ids ?? []
      });
    }

    return next(error);
  } finally {
    client.release();
  }
}

export async function assignSubjects(req, res, next) {
  const client = await pool.connect();

  try {
    const { id: teacherId } = teacherIdParamSchema.parse(req.params);
    const { subject_ids: incomingSubjectIds } = req.validatedBody;
    const subjectIds = toUniqueIds(incomingSubjectIds);

    if (!(await assertTeacherExists(client, teacherId))) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    await client.query("BEGIN");

    await assertSubjectIdsExist(client, subjectIds);

    if (subjectIds.length > 0) {
      await client.query(
        `
        INSERT INTO teacher_subjects (teacher_id, subject_id)
        SELECT $1, unnest($2::int[])
        ON CONFLICT (teacher_id, subject_id) DO NOTHING
        `,
        [teacherId, subjectIds]
      );
    }

    await client.query(
      `
      DELETE FROM teacher_subjects
      WHERE teacher_id = $1
        AND subject_id NOT IN (SELECT unnest($2::int[]))
      `,
      [teacherId, subjectIds]
    );

    const assignedSubjects = await client.query(
      `
      SELECT s.id, s.name
      FROM teacher_subjects ts
      JOIN subjects s ON s.id = ts.subject_id
      WHERE ts.teacher_id = $1
      ORDER BY s.name ASC
      `,
      [teacherId]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      teacher_id: teacherId,
      assigned_subjects: assignedSubjects.rows
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failures
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid teacher id or subject assignment payload" });
    }

    if (error?.status === 404) {
      return res.status(404).json({
        error: error.message,
        missing_subject_ids: error.missing_subject_ids ?? []
      });
    }

    return next(error);
  } finally {
    client.release();
  }
}

export async function getTeacherCredentials(req, res, next) {
  try {
    const { id: teacherId } = teacherIdParamSchema.parse(req.params);

    const teacherResult = await query(
      `
      SELECT id, name, email, plain_password
      FROM teachers
      WHERE id = $1
      `,
      [teacherId]
    );

    if (teacherResult.rowCount === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const row = teacherResult.rows[0];
    return res.status(200).json({
      teacher: row,
      credentials: {
        id: row.id,
        name: row.name,
        email: row.email,
        password: row.plain_password || null,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid teacher id" });
    }

    return next(error);
  }
}

export async function getAllSubjectsForAdmin(_req, res, next) {
  try {
    const result = await query(
      `
      SELECT s.*, COUNT(q.id)::int AS question_count
      FROM subjects s
      LEFT JOIN questions q ON q.subject_id = s.id
      GROUP BY s.id
      ORDER BY s.name
      `
    );

    return res.status(200).json({ subjects: result.rows });
  } catch (error) {
    return next(error);
  }
}

export async function getSubjectQuestionsForAdmin(req, res, next) {
  try {
    const { id: subjectId } = subjectIdParamSchema.parse(req.params);

    const result = await query(
      `
      SELECT q.*, u.name AS unit_name, t.name AS created_by_name
      FROM questions q
      LEFT JOIN units u ON u.id = q.unit_id
      LEFT JOIN teachers t ON t.id = q.created_by
      WHERE q.subject_id = $1
      ORDER BY q.created_at DESC
      `,
      [subjectId]
    );

    return res.status(200).json({ questions: result.rows });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid subject id" });
    }

    return next(error);
  }
}

export async function deleteTeacher(req, res, next) {
  const client = await pool.connect();

  try {
    const { id: teacherId } = teacherIdParamSchema.parse(req.params);

    await client.query("BEGIN");

    // Nullify foreign key references so the teacher can be deleted
    await client.query(`UPDATE questions SET created_by = NULL WHERE created_by = $1`, [teacherId]);
    await client.query(`UPDATE quizzes SET created_by = NULL WHERE created_by = $1`, [teacherId]);
    await client.query(`UPDATE subjects SET created_by = NULL WHERE created_by = $1`, [teacherId]);
    await client.query(`UPDATE units SET created_by = NULL WHERE created_by = $1`, [teacherId]);
    await client.query(`DELETE FROM teacher_subjects WHERE teacher_id = $1`, [teacherId]);
    await client.query(`DELETE FROM revoked_tokens WHERE user_id = $1`, [teacherId]);

    const result = await client.query(
      `DELETE FROM teachers WHERE id = $1 RETURNING id, name, email`,
      [teacherId]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Teacher not found" });
    }

    await client.query("COMMIT");
    return res.status(200).json({ message: "Teacher removed", teacher: result.rows[0] });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback failures
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid teacher id" });
    }

    return next(error);
  } finally {
    client.release();
  }
}
