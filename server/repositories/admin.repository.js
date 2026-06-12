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

export async function findExistingSubjectIds(db, subjectIds) {
  const result = await db.query(
    `SELECT id FROM subjects WHERE id = ANY($1::int[])`,
    [subjectIds],
  );

  return result.rows.map((row) => row.id);
}

export async function insertTeacher(db, teacher) {
  const result = await db.query(
    `
    INSERT INTO teachers (name, email, password, school, contact_no, plain_password)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, email, school, contact_no, created_at
    `,
    [teacher.name, teacher.email, teacher.passwordHash, teacher.school, teacher.contact_no ?? null, teacher.password],
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

export async function findAssignedSubjects(db, teacherId) {
  const result = await db.query(
    `
    SELECT s.id, s.name
    FROM teacher_subjects ts
    JOIN subjects s ON s.id = ts.subject_id
    WHERE ts.teacher_id = $1
    ORDER BY s.name ASC
    `,
    [teacherId],
  );

  return result.rows;
}

export async function findTeacherCredentials(db, teacherId) {
  const result = await db.query(
    `SELECT id, name, email, plain_password FROM teachers WHERE id = $1`,
    [teacherId],
  );

  return result.rows[0] ?? null;
}

export async function findAllSubjectsWithCounts(db) {
  const result = await db.query(
    `
    SELECT s.*, COUNT(q.id)::int AS question_count
    FROM subjects s
    LEFT JOIN questions q ON q.subject_id = s.id
    GROUP BY s.id
    ORDER BY s.name
    `,
  );

  return result.rows;
}

export async function findSubjectQuestionsForAdmin(db, subjectId) {
  const result = await db.query(
    `
    SELECT q.*, u.name AS unit_name, t.name AS created_by_name
    FROM questions q
    LEFT JOIN units u ON u.id = q.unit_id
    LEFT JOIN teachers t ON t.id = q.created_by
    WHERE q.subject_id = $1
    ORDER BY q.created_at DESC
    `,
    [subjectId],
  );

  return result.rows;
}

// Null out FK references and remove join rows so a teacher can be deleted.
export async function detachTeacherDependencies(db, teacherId) {
  await db.query(`UPDATE questions SET created_by = NULL WHERE created_by = $1`, [teacherId]);
  await db.query(`UPDATE quizzes SET created_by = NULL WHERE created_by = $1`, [teacherId]);
  await db.query(`UPDATE subjects SET created_by = NULL WHERE created_by = $1`, [teacherId]);
  await db.query(`UPDATE units SET created_by = NULL WHERE created_by = $1`, [teacherId]);
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
