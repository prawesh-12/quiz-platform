// Quiz-history reads over the local subjects read-model and quiz-owned question content.

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
