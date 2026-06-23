// Data access for quizzes and their questions. Every function takes a `db` (the pool
// or a transaction client) as its first argument so callers control the transaction.

const QUIZ_DETAIL_COLUMNS = `
  id, title, subject_id, created_by, duration_mins, batch, division, group_nos,
  status, quiz_date, scheduled_start, scheduled_end, access_code, access_token, created_at
`;

const QUIZ_RETURNING_COLUMNS = `
  id, title, subject_id, duration_mins, batch, division, group_nos, status, quiz_date,
  scheduled_start, scheduled_end, access_code, access_token, created_at
`;

// Columns required to evaluate ownership and plan status transitions.
export async function findQuizOwnershipBasics(db, quizId, userId) {
  const result = await db.query(
    `
    SELECT id, title, status, access_token, duration_mins, scheduled_start, scheduled_end, access_code
    FROM quizzes
    WHERE id = $1 AND created_by = $2
    `,
    [quizId, userId],
  );

  return result.rows[0] ?? null;
}

export async function findQuizDetail(db, quizId, userId) {
  const result = await db.query(
    `SELECT ${QUIZ_DETAIL_COLUMNS} FROM quizzes WHERE id = $1 AND created_by = $2`,
    [quizId, userId],
  );

  return result.rows[0] ?? null;
}

export async function listQuizzesForOwner(db, { userId, status, search, limit, offset }) {
  const result = await db.query(
    `
    SELECT
      q.id, q.title, q.subject_id, s.name AS subject_name, q.duration_mins,
      q.batch, q.division, q.group_nos, q.status, q.quiz_date, q.scheduled_start,
      q.scheduled_end, q.access_code, q.access_token, q.created_at,
      COUNT(*) OVER()::int AS total_count
    FROM quizzes q
    LEFT JOIN subjects s ON s.id = q.subject_id
    WHERE q.created_by = $1
      AND ($2::text IS NULL OR q.status = $2)
      AND (
        $3::text IS NULL
        OR q.title ILIKE '%' || $3 || '%'
        OR COALESCE(s.name, '') ILIKE '%' || $3 || '%'
      )
    ORDER BY q.created_at DESC, q.id DESC
    LIMIT $4 OFFSET $5
    `,
    [userId, status ?? null, search || null, limit, offset],
  );

  return result.rows;
}

export async function insertQuiz(db, metadata) {
  const result = await db.query(
    `
    INSERT INTO quizzes (
      title, subject_id, created_by, duration_mins, batch, division, group_nos, status,
      quiz_date, scheduled_start, scheduled_end, access_code
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING ${QUIZ_RETURNING_COLUMNS}
    `,
    [
      metadata.title,
      metadata.subject_id,
      metadata.created_by,
      metadata.duration_mins,
      metadata.batch,
      metadata.division,
      metadata.group_nos,
      metadata.status,
      metadata.quiz_date,
      metadata.scheduled_start,
      metadata.scheduled_end,
      metadata.access_code,
    ],
  );

  return result.rows[0];
}

export async function linkQuizQuestion(db, quizId, questionId, orderNo) {
  await db.query(
    `INSERT INTO quiz_questions (quiz_id, question_id, order_no) VALUES ($1, $2, $3)`,
    [quizId, questionId, orderNo],
  );
}

export async function insertInlineQuestion(db, quizId, question) {
  const result = await db.query(
    `
    INSERT INTO quiz_inline_questions (
      quiz_id, question_text, option_a, option_b, option_c, option_d,
      correct_option, has_equation, allow_multiple_answers, points, is_required
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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

// A quiz's questions come from two sources joined through the membership table; identity
// is the membership row id so bank and inline questions share one id space.
export async function findQuizQuestions(db, quizId) {
  const result = await db.query(
    `
    SELECT
      qq.id,
      COALESCE(q.subject_id, qz.subject_id) AS subject_id,
      COALESCE(q.question_text, iq.question_text) AS question_text,
      COALESCE(q.option_a, iq.option_a) AS option_a,
      COALESCE(q.option_b, iq.option_b) AS option_b,
      COALESCE(q.option_c, iq.option_c) AS option_c,
      COALESCE(q.option_d, iq.option_d) AS option_d,
      COALESCE(q.correct_option, iq.correct_option) AS correct_option,
      COALESCE(q.has_equation, iq.has_equation) AS has_equation,
      COALESCE(q.allow_multiple_answers, iq.allow_multiple_answers) AS allow_multiple_answers,
      COALESCE(q.points, iq.points) AS points,
      COALESCE(q.is_required, iq.is_required) AS is_required,
      qq.order_no
    FROM quiz_questions qq
    JOIN quizzes qz ON qz.id = qq.quiz_id
    LEFT JOIN questions q ON q.id = qq.question_id
    LEFT JOIN quiz_inline_questions iq ON iq.id = qq.inline_question_id
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
      COALESCE(q.question_text, iq.question_text) AS question_text,
      COALESCE(q.option_a, iq.option_a) AS option_a,
      COALESCE(q.option_b, iq.option_b) AS option_b,
      COALESCE(q.option_c, iq.option_c) AS option_c,
      COALESCE(q.option_d, iq.option_d) AS option_d,
      COALESCE(q.correct_option, iq.correct_option) AS correct_option,
      COALESCE(q.has_equation, iq.has_equation) AS has_equation,
      COALESCE(q.points, iq.points) AS points,
      qq.order_no
    FROM quiz_questions qq
    LEFT JOIN questions q ON q.id = qq.question_id
    LEFT JOIN quiz_inline_questions iq ON iq.id = qq.inline_question_id
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

// Columns the teacher may patch via updateQuiz. Whitelisted here so callers cannot
// build SET clauses for arbitrary columns.
const UPDATABLE_QUIZ_COLUMNS = new Set([
  "title",
  "duration_mins",
  "batch",
  "division",
  "group_nos",
  "status",
  "quiz_date",
  "scheduled_start",
  "scheduled_end",
  "access_code",
  "access_token",
]);

export async function updateQuizColumns(db, quizId, userId, patch) {
  const updates = [];
  const values = [];
  let position = 1;

  for (const [column, value] of Object.entries(patch)) {
    if (!UPDATABLE_QUIZ_COLUMNS.has(column)) {
      continue;
    }
    updates.push(`${column} = $${position}`);
    values.push(value);
    position += 1;
  }

  if (updates.length === 0) {
    return;
  }

  values.push(quizId, userId);
  await db.query(
    `UPDATE quizzes SET ${updates.join(", ")} WHERE id = $${position} AND created_by = $${position + 1}`,
    values,
  );
}

export async function deleteQuizCascade(db, quizId, userId) {
  await db.query(
    `DELETE FROM violation_flags WHERE session_id IN (SELECT id FROM student_sessions WHERE quiz_id = $1)`,
    [quizId],
  );
  await db.query(
    `DELETE FROM student_answers WHERE session_id IN (SELECT id FROM student_sessions WHERE quiz_id = $1)`,
    [quizId],
  );
  await db.query(`DELETE FROM student_sessions WHERE quiz_id = $1`, [quizId]);
  await db.query(`DELETE FROM quizzes WHERE id = $1 AND created_by = $2`, [quizId, userId]);
}

export async function findLiveStatsQuiz(db, quizId, userId) {
  const result = await db.query(
    `
    SELECT
      q.id, q.title, q.subject_id, s.name AS subject_name, q.batch, q.division,
      q.group_nos, q.duration_mins, q.quiz_date, q.status, q.scheduled_start,
      q.scheduled_end, q.access_code, q.access_token, q.created_at,
      (NOW() AT TIME ZONE 'Asia/Kolkata')::timestamp AS server_now
    FROM quizzes q
    LEFT JOIN subjects s ON s.id = q.subject_id
    WHERE q.id = $1 AND q.created_by = $2
    `,
    [quizId, userId],
  );

  return result.rows[0] ?? null;
}

export async function findSessionStatusCounts(db, quizId) {
  const result = await db.query(
    `
    SELECT
      COUNT(*)::int AS total_entered,
      COUNT(*) FILTER (WHERE status = 'submitted')::int AS submitted,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
    FROM student_sessions
    WHERE quiz_id = $1
    `,
    [quizId],
  );

  return result.rows[0];
}

export async function findFlaggedSessionCount(db, quizId) {
  const result = await db.query(
    `
    SELECT COUNT(DISTINCT ss.id)::int AS flagged
    FROM student_sessions ss
    INNER JOIN violation_flags vf ON vf.session_id = ss.id
    WHERE ss.quiz_id = $1
    `,
    [quizId],
  );

  return result.rows[0]?.flagged ?? 0;
}

export async function findQuizPreviewMeta(db, quizId, userId) {
  const result = await db.query(
    `
    SELECT id, title, subject_id, duration_mins, batch, division, group_nos, quiz_date, status, access_token
    FROM quizzes
    WHERE id = $1 AND created_by = $2
    `,
    [quizId, userId],
  );

  return result.rows[0] ?? null;
}

export async function findQuizBasic(db, quizId, userId) {
  const result = await db.query(
    `SELECT id, title, status FROM quizzes WHERE id = $1 AND created_by = $2`,
    [quizId, userId],
  );

  return result.rows[0] ?? null;
}

export async function findExportSummaryRows(db, quizId) {
  const result = await db.query(
    `
    SELECT
      ss.name, ss.roll_no, ss.email, ss.division, ss.group_no, ss.score, ss.total_points,
      COUNT(vf.id)::int AS violation_count
    FROM student_sessions ss
    LEFT JOIN violation_flags vf ON vf.session_id = ss.id
    WHERE ss.quiz_id = $1
    GROUP BY ss.id
    ORDER BY ss.started_at DESC, ss.id DESC
    `,
    [quizId],
  );

  return result.rows;
}

export async function findQuizForDuplicate(db, quizId, userId) {
  const result = await db.query(
    `
    SELECT id, title, subject_id, created_by, duration_mins, batch, division, group_nos,
           quiz_date, scheduled_start, scheduled_end, access_code
    FROM quizzes
    WHERE id = $1 AND created_by = $2
    `,
    [quizId, userId],
  );

  return result.rows[0] ?? null;
}

export async function insertDuplicateQuiz(db, source, title) {
  const result = await db.query(
    `
    INSERT INTO quizzes (
      title, subject_id, created_by, duration_mins, batch, division, group_nos, status,
      quiz_date, scheduled_start, scheduled_end, access_code
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, $9, $10, $11)
    RETURNING id
    `,
    [
      title,
      source.subject_id,
      source.created_by,
      source.duration_mins,
      source.batch,
      source.division,
      source.group_nos,
      source.quiz_date,
      source.scheduled_start,
      source.scheduled_end,
      source.access_code,
    ],
  );

  return result.rows[0].id;
}

// Bank references copy by id; inline questions are quiz-owned, so they are deep-copied
// into fresh rows for the target quiz before being linked.
export async function copyQuizQuestions(db, targetQuizId, sourceQuizId) {
  const { rows } = await db.query(
    `
    SELECT
      qq.order_no, qq.question_id,
      iq.question_text, iq.option_a, iq.option_b, iq.option_c, iq.option_d,
      iq.correct_option, iq.has_equation, iq.allow_multiple_answers, iq.points, iq.is_required
    FROM quiz_questions qq
    LEFT JOIN quiz_inline_questions iq ON iq.id = qq.inline_question_id
    WHERE qq.quiz_id = $1
    ORDER BY qq.order_no ASC, qq.id ASC
    `,
    [sourceQuizId],
  );

  for (const row of rows) {
    if (row.question_id) {
      await linkQuizQuestion(db, targetQuizId, row.question_id, row.order_no);
      continue;
    }

    const inlineId = await insertInlineQuestion(db, targetQuizId, row);
    await linkInlineQuizQuestion(db, targetQuizId, inlineId, row.order_no);
  }
}

export async function findLeaderboard(db, quizId) {
  const result = await db.query(
    `
    SELECT
      id AS session_id, name, roll_no, score, total_points,
      EXTRACT(EPOCH FROM (submitted_at - started_at))::int AS time_taken_secs
    FROM student_sessions
    WHERE quiz_id = $1 AND status = 'submitted'
    ORDER BY score DESC NULLS LAST, time_taken_secs ASC NULLS LAST, submitted_at ASC NULLS LAST
    LIMIT 10
    `,
    [quizId],
  );

  return result.rows;
}

export async function findUnitInSubject(db, unitId, subjectId) {
  const result = await db.query(
    `SELECT id, name FROM units WHERE id = $1 AND subject_id = $2`,
    [unitId, subjectId],
  );

  return result.rows[0] ?? null;
}

export async function countBankQuestionsInUnit(db, unitId, subjectId) {
  const result = await db.query(
    `
    SELECT COUNT(*)::int AS available_count
    FROM questions
    WHERE unit_id = $1 AND in_subject_bank = TRUE AND subject_id = $2
    `,
    [unitId, subjectId],
  );

  return result.rows[0]?.available_count ?? 0;
}

export async function pickRandomBankQuestions(db, unitId, subjectId, count) {
  const result = await db.query(
    `
    SELECT id
    FROM questions
    WHERE unit_id = $1 AND in_subject_bank = TRUE AND subject_id = $2
    ORDER BY RANDOM()
    LIMIT $3
    `,
    [unitId, subjectId, count],
  );

  return result.rows.map((row) => row.id);
}
