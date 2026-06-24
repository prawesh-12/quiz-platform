// Data access for the quizzes table. Every function takes a `db` (the pool or a
// transaction client) as its first argument so callers control the transaction.

const QUIZ_DETAIL_COLUMNS = `
  id, title, subject_id, created_by, duration_mins, batch, division, group_nos,
  status, quiz_date, scheduled_start, scheduled_end, access_code, access_token, created_at
`;

const QUIZ_RETURNING_COLUMNS = `
  id, title, subject_id, created_by, duration_mins, batch, division, group_nos, status,
  quiz_date, scheduled_start, scheduled_end, access_code, access_token, created_at
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

// Full metadata row by id alone, for event payloads where ownership is already established.
export async function findQuizMetaById(db, quizId) {
  const result = await db.query(
    `SELECT ${QUIZ_DETAIL_COLUMNS} FROM quizzes WHERE id = $1`,
    [quizId],
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

// Quiz owns only its own rows; quiz_inline_questions and quiz_questions cascade off the
// quiz row. Exam tables are the Exam service's responsibility.
export async function deleteQuizCascade(db, quizId, userId) {
  const result = await db.query(
    `DELETE FROM quizzes WHERE id = $1 AND created_by = $2 RETURNING id`,
    [quizId, userId],
  );

  return result.rows[0] ?? null;
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
