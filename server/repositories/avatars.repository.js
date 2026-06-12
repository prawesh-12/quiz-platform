// Data access for teacher avatar blobs. Each function takes a `db` (the pool or a
// transaction client).

export async function findAvatar(db, teacherId) {
  const result = await db.query(
    `SELECT id, avatar_data, avatar_mime FROM teachers WHERE id = $1`,
    [teacherId],
  );

  return result.rows[0] ?? null;
}

export async function setAvatar(db, teacherId, data, mime) {
  const result = await db.query(
    `
    UPDATE teachers
    SET avatar_data = $1, avatar_mime = $2, has_avatar = TRUE
    WHERE id = $3
    RETURNING id
    `,
    [data, mime, teacherId],
  );

  return result.rows[0] ?? null;
}

export async function clearAvatar(db, teacherId) {
  const result = await db.query(
    `
    UPDATE teachers
    SET avatar_data = NULL, avatar_mime = NULL, has_avatar = FALSE
    WHERE id = $1
    RETURNING id
    `,
    [teacherId],
  );

  return result.rows[0] ?? null;
}
