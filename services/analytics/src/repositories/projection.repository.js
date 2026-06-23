// Idempotent writes into the read-model tables. ON CONFLICT keeps event delivery
// at-least-once and out-of-order safe.

export async function upsertQuiz(db, quiz) {
  await db.query(
    `
    INSERT INTO quizzes (id, created_by, subject_id, title, status, quiz_date, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET
      created_by = EXCLUDED.created_by,
      subject_id = EXCLUDED.subject_id,
      title = EXCLUDED.title,
      status = EXCLUDED.status,
      quiz_date = EXCLUDED.quiz_date,
      created_at = EXCLUDED.created_at
    `,
    [quiz.id, quiz.created_by, quiz.subject_id, quiz.title, quiz.status, quiz.quiz_date, quiz.created_at]
  );
}

export async function deleteQuizCascade(db, quizId) {
  await db.query("DELETE FROM violation_flags WHERE quiz_id = $1", [quizId]);
  await db.query("DELETE FROM student_sessions WHERE quiz_id = $1", [quizId]);
  await db.query("DELETE FROM quizzes WHERE id = $1", [quizId]);
}

export async function upsertSubject(db, subject) {
  await db.query(
    `
    INSERT INTO subjects (id, name)
    VALUES ($1, $2)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `,
    [subject.id, subject.name]
  );
}

export async function deleteSubject(db, subjectId) {
  await db.query("DELETE FROM subjects WHERE id = $1", [subjectId]);
}

export async function insertSessionStarted(db, session) {
  await db.query(
    `
    INSERT INTO student_sessions
      (id, quiz_id, name, roll_no, email, division, group_no, started_at, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
    ON CONFLICT (id) DO UPDATE SET
      quiz_id = EXCLUDED.quiz_id,
      name = EXCLUDED.name,
      roll_no = EXCLUDED.roll_no,
      email = EXCLUDED.email,
      division = EXCLUDED.division,
      group_no = EXCLUDED.group_no,
      started_at = EXCLUDED.started_at
    `,
    [
      session.sessionId,
      session.quizId,
      session.name,
      session.rollNo,
      session.email,
      session.division,
      session.groupNo,
      session.startedAt
    ]
  );
}

export async function applySessionSubmitted(db, session) {
  await db.query(
    `
    INSERT INTO student_sessions
      (id, quiz_id, score, total_points, submitted_at, status)
    VALUES ($1, $2, $3, $4, $5, 'submitted')
    ON CONFLICT (id) DO UPDATE SET
      quiz_id = EXCLUDED.quiz_id,
      score = EXCLUDED.score,
      total_points = EXCLUDED.total_points,
      submitted_at = EXCLUDED.submitted_at,
      status = 'submitted'
    `,
    [session.sessionId, session.quizId, session.score, session.totalPoints, session.submittedAt]
  );
}

export async function upsertViolationFlag(db, sessionId, quizId) {
  await db.query(
    `
    INSERT INTO violation_flags (session_id, quiz_id)
    VALUES ($1, $2)
    ON CONFLICT (session_id) DO NOTHING
    `,
    [sessionId, quizId]
  );
}
