// Data access for proctoring violation flags. Each function takes a `db` (the pool or
// a transaction client).

export async function findSessionByToken(db, sessionToken) {
  const result = await db.query(
    `SELECT id, status FROM student_sessions WHERE session_token = $1`,
    [sessionToken],
  );

  return result.rows[0] ?? null;
}

export async function insertViolation(db, sessionId, type, description) {
  await db.query(
    `INSERT INTO violation_flags (session_id, type, description) VALUES ($1, $2, $3)`,
    [sessionId, type, description ?? null],
  );
}

// Session owned by the requesting teacher (via the quiz's created_by).
export async function findTeacherSession(db, sessionId, userId) {
  const result = await db.query(
    `
    SELECT
      ss.id, ss.quiz_id, ss.name, ss.roll_no, ss.email, ss.division, ss.group_no,
      ss.status, ss.score, ss.total_points, ss.started_at, ss.submitted_at
    FROM student_sessions ss
    INNER JOIN quizzes q ON q.id = ss.quiz_id
    WHERE ss.id = $1 AND q.created_by = $2
    `,
    [sessionId, userId],
  );

  return result.rows[0] ?? null;
}

export async function findSessionAnswers(db, sessionId, quizId) {
  const result = await db.query(
    `
    SELECT
      qq.order_no, qq.id AS question_id,
      COALESCE(q.question_text, iq.question_text) AS question_text,
      COALESCE(q.correct_option, iq.correct_option) AS correct_option,
      COALESCE(q.points, iq.points) AS points,
      sa.selected_option, sa.is_correct, sa.answered_at
    FROM quiz_questions qq
    LEFT JOIN questions q ON q.id = qq.question_id
    LEFT JOIN quiz_inline_questions iq ON iq.id = qq.inline_question_id
    LEFT JOIN student_answers sa ON sa.session_id = $1 AND sa.question_id = qq.id
    WHERE qq.quiz_id = $2
    ORDER BY qq.order_no ASC, qq.id ASC
    `,
    [sessionId, quizId],
  );

  return result.rows;
}

export async function findViolationsBySession(db, sessionId) {
  const result = await db.query(
    `
    SELECT id, type, description, occurred_at
    FROM violation_flags
    WHERE session_id = $1
    ORDER BY occurred_at ASC, id ASC
    `,
    [sessionId],
  );

  return result.rows;
}
