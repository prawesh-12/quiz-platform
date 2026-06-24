// Data access for subjects. Each function takes a `db` (the pool or a transaction client).

// A teacher "owns" a subject if they created it or have been assigned to it.
export async function subjectBelongsToTeacher(db, subjectId, userId) {
  const result = await db.query(
    `
    SELECT s.id
    FROM subjects s
    LEFT JOIN teacher_subjects ts ON ts.subject_id = s.id AND ts.teacher_id = $2
    WHERE s.id = $1 AND (s.created_by = $2 OR ts.teacher_id = $2)
    `,
    [subjectId, userId],
  );

  return result.rowCount > 0;
}

// Whether the requester may manage the subject: admins always, teachers only the
// subjects they created.
export async function isSubjectManageable(db, subjectId, requester) {
  const result =
    requester.role === "admin"
      ? await db.query(`SELECT id FROM subjects WHERE id = $1`, [subjectId])
      : await db.query(`SELECT id FROM subjects WHERE id = $1 AND created_by = $2`, [
          subjectId,
          requester.id,
        ]);

  return result.rowCount > 0;
}

export async function listSubjects(db, requester) {
  const result =
    requester.role === "admin"
      ? await db.query(`SELECT id, name, created_by, created_at FROM subjects ORDER BY name ASC`)
      : await db.query(
          `
          SELECT DISTINCT s.id, s.name, s.created_by, s.created_at
          FROM subjects s
          JOIN teacher_subjects ts ON ts.subject_id = s.id AND ts.teacher_id = $1
          ORDER BY s.name ASC
          `,
          [requester.id],
        );

  return result.rows;
}

export async function insertSubject(db, name, createdBy) {
  const result = await db.query(
    `INSERT INTO subjects (name, created_by) VALUES ($1, $2) RETURNING id, name, created_by, created_at`,
    [name, createdBy],
  );

  return result.rows[0];
}

export async function deleteSubject(db, subjectId, requester) {
  const result =
    requester.role === "admin"
      ? await db.query(`DELETE FROM subjects WHERE id = $1 RETURNING id`, [subjectId])
      : await db.query(`DELETE FROM subjects WHERE id = $1 AND created_by = $2 RETURNING id`, [
          subjectId,
          requester.id,
        ]);

  return result.rows[0] ?? null;
}
