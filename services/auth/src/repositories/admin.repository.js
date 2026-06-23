// Data access for admin teacher/subject management. Each function takes a `db` (the
// pool or a transaction client) so callers control the transaction boundary.

export async function findAllTeachers(db) {
  const result = await db.query(
    `
    SELECT t.id, t.name, t.email, t.contact_no, t.school, t.created_at
    FROM teachers t
    ORDER BY t.name ASC, t.created_at ASC
    `,
  );

  return result.rows;
}

export async function clearTeacherSchool(db, teacherId) {
  const result = await db.query(
    `UPDATE teachers SET school = NULL WHERE id = $1 RETURNING id, name, email`,
    [teacherId],
  );

  return result.rows[0] ?? null;
}

export async function findTeachersBySchool(db, school) {
  const result = await db.query(
    `
    SELECT
      t.id, t.name, t.email, t.contact_no, t.school, t.created_at,
      COALESCE(
        json_agg(ts.subject_id ORDER BY ts.subject_id)
          FILTER (WHERE ts.subject_id IS NOT NULL),
        '[]'::json
      ) AS assigned_subject_ids
    FROM teachers t
    LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id
    WHERE t.school = $1
    GROUP BY t.id
    ORDER BY t.name ASC, t.created_at ASC
    `,
    [school],
  );

  return result.rows;
}

export async function findTeacherByEmail(db, email) {
  const result = await db.query(`SELECT id FROM teachers WHERE email = $1`, [email]);
  return result.rows[0] ?? null;
}

export async function teacherExists(db, teacherId) {
  const result = await db.query(`SELECT id FROM teachers WHERE id = $1`, [teacherId]);
  return result.rowCount > 0;
}

export async function insertTeacher(db, teacher) {
  const result = await db.query(
    `
    INSERT INTO teachers (name, email, password, school, contact_no)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, school, contact_no, created_at
    `,
    [teacher.name, teacher.email, teacher.passwordHash, teacher.school, teacher.contact_no ?? null],
  );

  return result.rows[0];
}

export async function assignTeacherSubjects(db, teacherId, subjectIds) {
  await db.query(
    `
    INSERT INTO teacher_subjects (teacher_id, subject_id)
    SELECT $1, unnest($2::int[])
    ON CONFLICT (teacher_id, subject_id) DO NOTHING
    `,
    [teacherId, subjectIds],
  );
}

export async function removeTeacherSubjectsNotIn(db, teacherId, subjectIds) {
  await db.query(
    `
    DELETE FROM teacher_subjects
    WHERE teacher_id = $1
      AND subject_id NOT IN (SELECT unnest($2::int[]))
    `,
    [teacherId, subjectIds],
  );
}

export async function findAssignedSubjectIds(db, teacherId) {
  const result = await db.query(
    `SELECT subject_id FROM teacher_subjects WHERE teacher_id = $1 ORDER BY subject_id ASC`,
    [teacherId],
  );

  return result.rows.map((row) => row.subject_id);
}

export async function findTeacherCredentials(db, teacherId) {
  const result = await db.query(
    `SELECT id, name, email, plain_password FROM teachers WHERE id = $1`,
    [teacherId],
  );

  return result.rows[0] ?? null;
}

// Remove only this service's own join/revocation rows so a teacher can be deleted.
// Content tables in other services are cleaned up via the teacher.deleted event.
export async function detachTeacherDependencies(db, teacherId) {
  await db.query(`DELETE FROM teacher_subjects WHERE teacher_id = $1`, [teacherId]);
  await db.query(`DELETE FROM revoked_tokens WHERE user_id = $1`, [teacherId]);
}

export async function deleteTeacher(db, teacherId) {
  const result = await db.query(
    `DELETE FROM teachers WHERE id = $1 RETURNING id, name, email`,
    [teacherId],
  );

  return result.rows[0] ?? null;
}
