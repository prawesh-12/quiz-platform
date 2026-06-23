// Read access for the teacher-monitoring quiz views. Quiz metadata comes from the local
// quizzes read-model; participation/scores come from the exam tables.

export async function findQuizOwnershipBasics(db, quizId, userId) {
  const result = await db.query(
    `SELECT id, title, status FROM quizzes WHERE id = $1 AND created_by = $2`,
    [quizId, userId],
  );

  return result.rows[0] ?? null;
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
