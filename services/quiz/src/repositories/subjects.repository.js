// Local read-model of subjects, projected from events:questionbank, plus the quiz-history
// reads over quiz-owned question content. Writes are upsert/delete so re-delivered events
// stay idempotent.

export async function upsertSubject(db, subject) {
  await db.query(
    `
    INSERT INTO subjects (id, name, created_by)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name, created_by = EXCLUDED.created_by
    `,
    [subject.id, subject.name ?? null, subject.createdBy ?? null],
  );
}

export async function deleteSubject(db, subjectId) {
  await db.query(`DELETE FROM subjects WHERE id = $1`, [subjectId]);
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

export async function findSubjectQuizHistoryRows(db, subjectId, requester) {
  const result = await db.query(
    `
    SELECT
      qz.id AS quiz_id, qz.title, qz.quiz_date, qz.status, qz.created_at AS quiz_created_at,
      qq.id AS question_id,
      iq.question_text, iq.correct_option, iq.points, iq.has_equation,
      iq.option_a, iq.option_b, iq.option_c, iq.option_d,
      qq.order_no
    FROM quizzes qz
    JOIN quiz_questions qq ON qq.quiz_id = qz.id
    JOIN quiz_inline_questions iq ON iq.id = qq.inline_question_id
    WHERE qz.subject_id = $1
      AND ($2::text = 'admin' OR qz.created_by = $3)
    ORDER BY qz.quiz_date DESC NULLS LAST, qz.created_at DESC, qq.order_no ASC
    `,
    [subjectId, requester.role, requester.id],
  );

  return result.rows;
}
