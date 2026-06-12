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

export async function findSubjectQuizHistoryRows(db, subjectId, requester) {
  const result = await db.query(
    `
    SELECT
      qz.id AS quiz_id, qz.title, qz.quiz_date, qz.status, qz.created_at AS quiz_created_at,
      q.id AS question_id, q.question_text, q.correct_option, q.points, q.has_equation,
      q.option_a, q.option_b, q.option_c, q.option_d, qq.order_no
    FROM quizzes qz
    JOIN quiz_questions qq ON qq.quiz_id = qz.id
    JOIN questions q ON q.id = qq.question_id
    WHERE qz.subject_id = $1
      AND ($2::text = 'admin' OR qz.created_by = $3)
    ORDER BY qz.quiz_date DESC NULLS LAST, qz.created_at DESC, qq.order_no ASC
    `,
    [subjectId, requester.role, requester.id],
  );

  return result.rows;
}
