// Aggregate queries computed in one round trip each (replacing client-side rollups).
// createdBy scopes to a teacher; null = admin (all quizzes).

// Participant identity: email > roll_no > name > session id (matches the old client logic).
const PARTICIPANT_KEY = `
  lower(coalesce(
    nullif(btrim(ss.email), ''),
    nullif(btrim(ss.roll_no), ''),
    nullif(btrim(ss.name), ''),
    'session:' || ss.id::text
  ))
`;

export async function findStatusCounts(db, createdBy) {
  const result = await db.query(
    `
    SELECT status, COUNT(*)::int AS count
    FROM quizzes
    WHERE ($1::int IS NULL OR created_by = $1)
    GROUP BY status
    `,
    [createdBy]
  );
  return result.rows;
}

export async function findKpis(db, createdBy) {
  const result = await db.query(
    `
    WITH scoped AS (
      SELECT ss.id, ss.started_at, ${PARTICIPANT_KEY} AS pkey
      FROM student_sessions ss
      JOIN quizzes q ON q.id = ss.quiz_id
      WHERE ($1::int IS NULL OR q.created_by = $1)
    ),
    firsts AS (
      SELECT pkey, MIN(started_at) AS first_seen
      FROM scoped
      GROUP BY pkey
    )
    SELECT
      (SELECT COUNT(DISTINCT pkey) FROM scoped)::int AS total_participants,
      (SELECT COUNT(*) FROM scoped
         WHERE date_trunc('day', started_at) = date_trunc('day', NOW()))::int AS attempts_today,
      (SELECT COUNT(*) FROM firsts
         WHERE date_trunc('day', first_seen) = date_trunc('day', NOW()))::int AS new_participants_today,
      (SELECT COUNT(DISTINCT vf.session_id)
         FROM violation_flags vf
         JOIN student_sessions ss ON ss.id = vf.session_id
         JOIN quizzes q ON q.id = ss.quiz_id
         WHERE ($1::int IS NULL OR q.created_by = $1))::int AS flagged_sessions
    `,
    [createdBy]
  );
  return result.rows[0];
}

export async function findPerQuizStats(db, createdBy) {
  const result = await db.query(
    `
    SELECT
      q.id AS quiz_id,
      q.title AS quiz_title,
      q.subject_id,
      sub.name AS subject_name,
      q.status,
      q.quiz_date,
      q.created_at,
      COUNT(ss.id)::int AS attempts,
      COUNT(DISTINCT ${PARTICIPANT_KEY})::int AS participants,
      AVG(CASE WHEN ss.total_points > 0 AND ss.score IS NOT NULL
               THEN ss.score::numeric / ss.total_points * 100 END) AS avg_score_percent,
      AVG(CASE WHEN ss.submitted_at IS NOT NULL AND ss.submitted_at >= ss.started_at
               THEN EXTRACT(EPOCH FROM (ss.submitted_at - ss.started_at)) END) AS avg_time_seconds
    FROM quizzes q
    LEFT JOIN subjects sub ON sub.id = q.subject_id
    LEFT JOIN student_sessions ss ON ss.quiz_id = q.id
    WHERE ($1::int IS NULL OR q.created_by = $1)
    GROUP BY q.id, sub.name
    ORDER BY COALESCE(q.quiz_date, q.created_at) DESC NULLS LAST, q.id DESC
    `,
    [createdBy]
  );
  return result.rows;
}

export async function findPerSubjectStats(db, createdBy) {
  const result = await db.query(
    `
    SELECT
      sub.id AS subject_id,
      COALESCE(sub.name, 'Unassigned') AS subject_name,
      COUNT(DISTINCT ${PARTICIPANT_KEY})::int AS participants,
      AVG(CASE WHEN ss.total_points > 0 AND ss.score IS NOT NULL
               THEN ss.score::numeric / ss.total_points * 100 END) AS avg_score_percent
    FROM quizzes q
    LEFT JOIN subjects sub ON sub.id = q.subject_id
    LEFT JOIN student_sessions ss ON ss.quiz_id = q.id
    WHERE ($1::int IS NULL OR q.created_by = $1)
    GROUP BY sub.id, sub.name
    `,
    [createdBy]
  );
  return result.rows;
}

export async function findParticipantTrend(db, createdBy, startAt, endAt) {
  const result = await db.query(
    `
    SELECT
      to_char(date_trunc('day', ss.started_at), 'YYYY-MM-DD') AS day,
      COUNT(DISTINCT ${PARTICIPANT_KEY})::int AS participants
    FROM student_sessions ss
    JOIN quizzes q ON q.id = ss.quiz_id
    WHERE ($1::int IS NULL OR q.created_by = $1)
      AND ss.started_at >= $2
      AND ss.started_at < $3
    GROUP BY 1
    ORDER BY 1
    `,
    [createdBy, startAt, endAt]
  );
  return result.rows;
}
