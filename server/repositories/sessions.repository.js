// Data access for student quiz sessions. Each function takes a `db` (the pool or a
// transaction client) so callers control the transaction boundary.

export async function findActiveQuizByAccessToken(db, accessToken) {
  const result = await db.query(
    `
    SELECT
      q.id, q.title, q.subject_id, q.duration_mins, q.quiz_date, q.status,
      q.scheduled_start, q.scheduled_end, q.access_code, q.created_at,
      (NOW() AT TIME ZONE 'Asia/Kolkata')::timestamp AS server_now,
      s.name AS subject_name
    FROM quizzes q
    LEFT JOIN subjects s ON s.id = q.subject_id
    WHERE q.access_token = $1
      AND q.status IN ('active', 'scheduled')
    `,
    [accessToken],
  );

  return result.rows[0] ?? null;
}

export async function insertStudentSession(db, session) {
  await db.query(
    `
    INSERT INTO student_sessions (quiz_id, name, roll_no, email, division, group_no, session_token, status, started_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', (NOW() AT TIME ZONE 'Asia/Kolkata')::timestamp)
    `,
    [
      session.quizId,
      session.name,
      session.rollNo,
      session.email,
      session.division,
      session.groupNo,
      session.sessionToken,
    ],
  );
}

// Session joined with its quiz, plus the server clock. Pass `lock` to take a row lock
// on the session (FOR UPDATE) when the caller is inside a write transaction.
export async function findSessionContextRow(db, sessionToken, { lock = false } = {}) {
  const result = await db.query(
    `
    SELECT
      ss.id, ss.quiz_id, ss.status, ss.score, ss.total_points, ss.submission_id,
      q.status AS quiz_status, q.scheduled_start, q.scheduled_end, q.duration_mins, q.created_at,
      (NOW() AT TIME ZONE 'Asia/Kolkata')::timestamp AS server_now
    FROM student_sessions ss
    INNER JOIN quizzes q ON q.id = ss.quiz_id
    WHERE ss.session_token = $1
    ${lock ? "FOR UPDATE OF ss" : ""}
    `,
    [sessionToken],
  );

  return result.rows[0] ?? null;
}

export async function fetchBreakdownRows(db, sessionId, quizId) {
  const result = await db.query(
    `
    SELECT q.order_no, q.id AS question_id, q.question_text, q.points, q.correct_option,
           sa.selected_option, sa.is_correct
    FROM exam.quiz_snapshot s
    CROSS JOIN jsonb_to_recordset(s.payload) AS q(
      id int, order_no int, question_text text, points int, correct_option text
    )
    LEFT JOIN student_answers sa ON sa.session_id = $1 AND sa.question_id = q.id
    WHERE s.quiz_id = $2
    ORDER BY q.order_no ASC, q.id ASC
    `,
    [sessionId, quizId],
  );

  return result.rows;
}
