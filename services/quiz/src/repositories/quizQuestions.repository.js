// Data access for quiz questions (inline + membership rows). Every function takes a `db`
// (the pool or a transaction client) so callers control the transaction.

export async function insertInlineQuestion(db, quizId, question) {
  const result = await db.query(
    `
    INSERT INTO quiz_inline_questions (
      quiz_id, question_text, option_a, option_b, option_c, option_d,
      correct_option, has_equation, allow_multiple_answers, points, is_required,
      source_question_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id
    `,
    [
      quizId,
      question.question_text,
      question.option_a,
      question.option_b,
      question.option_c ?? null,
      question.option_d ?? null,
      question.correct_option,
      question.has_equation ?? false,
      question.allow_multiple_answers ?? false,
      question.points ?? 1,
      question.is_required ?? true,
      question.source_question_id ?? null,
    ],
  );

  return result.rows[0].id;
}

export async function linkInlineQuizQuestion(db, quizId, inlineQuestionId, orderNo) {
  await db.query(
    `INSERT INTO quiz_questions (quiz_id, inline_question_id, order_no) VALUES ($1, $2, $3)`,
    [quizId, inlineQuestionId, orderNo],
  );
}

// Identity is the membership row id; question content lives in the quiz-owned inline rows.
export async function findQuizQuestions(db, quizId) {
  const result = await db.query(
    `
    SELECT
      qq.id,
      qz.subject_id,
      iq.question_text,
      iq.option_a,
      iq.option_b,
      iq.option_c,
      iq.option_d,
      iq.correct_option,
      iq.has_equation,
      iq.allow_multiple_answers,
      iq.points,
      iq.is_required,
      qq.order_no
    FROM quiz_questions qq
    JOIN quizzes qz ON qz.id = qq.quiz_id
    JOIN quiz_inline_questions iq ON iq.id = qq.inline_question_id
    WHERE qq.quiz_id = $1
    ORDER BY qq.order_no ASC, qq.id ASC
    `,
    [quizId],
  );

  return result.rows;
}

export async function findQuizQuestionsPreview(db, quizId) {
  const result = await db.query(
    `
    SELECT
      qq.id,
      iq.question_text,
      iq.option_a,
      iq.option_b,
      iq.option_c,
      iq.option_d,
      iq.correct_option,
      iq.has_equation,
      iq.points,
      qq.order_no
    FROM quiz_questions qq
    JOIN quiz_inline_questions iq ON iq.id = qq.inline_question_id
    WHERE qq.quiz_id = $1
    ORDER BY qq.order_no ASC, qq.id ASC
    `,
    [quizId],
  );

  return result.rows;
}

// Full question set including correct_option, ordered for the snapshot build.
export async function fetchStudentQuizQuestions(db, quizId) {
  const result = await db.query(
    `
    SELECT
      qq.id,
      iq.question_text,
      iq.option_a,
      iq.option_b,
      iq.option_c,
      iq.option_d,
      iq.has_equation,
      iq.points,
      iq.correct_option,
      qq.order_no
    FROM quiz_questions qq
    JOIN quiz_inline_questions iq ON iq.id = qq.inline_question_id
    WHERE qq.quiz_id = $1
    ORDER BY qq.order_no ASC, qq.id ASC
    `,
    [quizId],
  );

  return result.rows;
}

export async function findQuizQuestionIdsOrdered(db, quizId) {
  const result = await db.query(
    `SELECT id FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_no ASC, id ASC`,
    [quizId],
  );

  return result.rows.map((row) => Number(row.id));
}

export async function setQuizQuestionOrder(db, quizId, quizQuestionId, orderNo) {
  await db.query(
    `UPDATE quiz_questions SET order_no = $1 WHERE quiz_id = $2 AND id = $3`,
    [orderNo, quizId, quizQuestionId],
  );
}

// Inline questions are quiz-owned, so they are deep-copied into fresh rows for the target
// quiz before being linked.
export async function copyQuizQuestions(db, targetQuizId, sourceQuizId) {
  const { rows } = await db.query(
    `
    SELECT
      qq.order_no,
      iq.question_text, iq.option_a, iq.option_b, iq.option_c, iq.option_d,
      iq.correct_option, iq.has_equation, iq.allow_multiple_answers, iq.points,
      iq.is_required, iq.source_question_id
    FROM quiz_questions qq
    JOIN quiz_inline_questions iq ON iq.id = qq.inline_question_id
    WHERE qq.quiz_id = $1
    ORDER BY qq.order_no ASC, qq.id ASC
    `,
    [sourceQuizId],
  );

  for (const row of rows) {
    const inlineId = await insertInlineQuestion(db, targetQuizId, row);
    await linkInlineQuizQuestion(db, targetQuizId, inlineId, row.order_no);
  }
}
