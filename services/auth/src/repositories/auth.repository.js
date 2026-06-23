// Data access for authentication (teacher accounts and revoked tokens). Each function
// takes a `db` (the pool or a transaction client).

const TEACHER_PROFILE_COLUMNS = `id, name, email, school, contact_no, has_avatar, created_at`;

export async function findTeacherIdByEmail(db, email) {
  const result = await db.query(`SELECT id FROM teachers WHERE email = $1`, [email]);
  return result.rows[0] ?? null;
}

export async function insertTeacher(db, { name, email, hashedPassword }) {
  const result = await db.query(
    `
    INSERT INTO teachers (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING ${TEACHER_PROFILE_COLUMNS}
    `,
    [name, email, hashedPassword],
  );

  return result.rows[0];
}

export async function findTeacherByEmail(db, email) {
  const result = await db.query(
    `SELECT id, name, email, password, school, contact_no, has_avatar, created_at FROM teachers WHERE email = $1`,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function existsRevokedToken(db, tokenHash) {
  const result = await db.query(
    `
    SELECT 1
    FROM revoked_tokens
    WHERE token_hash = $1 AND expires_at > NOW()
    LIMIT 1
    `,
    [tokenHash],
  );

  return result.rowCount > 0;
}

export async function insertRevokedToken(db, tokenHash, userId, exp) {
  await db.query(
    `
    INSERT INTO revoked_tokens (token_hash, user_id, expires_at)
    VALUES ($1, $2, to_timestamp($3))
    ON CONFLICT (token_hash) DO NOTHING
    `,
    [tokenHash, userId, exp],
  );
}

export async function deleteExpiredRevokedTokens(db) {
  await db.query(`DELETE FROM revoked_tokens WHERE expires_at <= NOW()`);
}

export async function findTeacherById(db, teacherId) {
  const result = await db.query(
    `SELECT ${TEACHER_PROFILE_COLUMNS} FROM teachers WHERE id = $1`,
    [teacherId],
  );

  return result.rows[0] ?? null;
}

export async function updateTeacherName(db, teacherId, name) {
  const result = await db.query(
    `UPDATE teachers SET name = $1 WHERE id = $2 RETURNING ${TEACHER_PROFILE_COLUMNS}`,
    [name, teacherId],
  );

  return result.rows[0] ?? null;
}

export async function findTeacherPasswordById(db, teacherId) {
  const result = await db.query(`SELECT id, password FROM teachers WHERE id = $1`, [teacherId]);
  return result.rows[0] ?? null;
}

export async function updateTeacherPassword(db, teacherId, passwordHash) {
  await db.query(`UPDATE teachers SET password = $1 WHERE id = $2`, [passwordHash, teacherId]);
}
