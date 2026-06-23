// Data access for units. Each function takes a `db` (the pool or a transaction client).
// Access checks are role-aware: admins can reach any subject/unit, teachers only those
// they created or were assigned.

export async function isSubjectAccessible(db, subjectId, requester) {
  const result =
    requester.role === "admin"
      ? await db.query(`SELECT id FROM subjects WHERE id = $1`, [subjectId])
      : await db.query(
          `
          SELECT s.id FROM subjects s
          LEFT JOIN teacher_subjects ts ON ts.subject_id = s.id AND ts.teacher_id = $2
          WHERE s.id = $1 AND (s.created_by = $2 OR ts.teacher_id = $2)
          `,
          [subjectId, requester.id],
        );

  return result.rowCount > 0;
}

export async function isUnitAccessible(db, unitId, requester) {
  const result =
    requester.role === "admin"
      ? await db.query(`SELECT u.id FROM units u WHERE u.id = $1`, [unitId])
      : await db.query(
          `
          SELECT u.id
          FROM units u
          JOIN subjects s ON s.id = u.subject_id
          LEFT JOIN teacher_subjects ts ON ts.subject_id = s.id AND ts.teacher_id = $2
          WHERE u.id = $1 AND (s.created_by = $2 OR ts.teacher_id = $2)
          `,
          [unitId, requester.id],
        );

  return result.rowCount > 0;
}

export async function listUnitsWithQuestionCounts(db, subjectId, requester) {
  // Teachers only count bank questions belonging to this subject; admins count all
  // bank questions in the unit.
  const result =
    requester.role === "admin"
      ? await db.query(
          `
          SELECT u.id, u.name, u.order_no, u.created_at,
                 COUNT(q.id)::int AS question_count
          FROM units u
          LEFT JOIN questions q ON q.unit_id = u.id AND q.in_subject_bank = TRUE
          WHERE u.subject_id = $1
          GROUP BY u.id
          ORDER BY u.order_no ASC, u.created_at ASC
          `,
          [subjectId],
        )
      : await db.query(
          `
          SELECT u.id, u.name, u.order_no, u.created_at,
                 COUNT(q.id)::int AS question_count
          FROM units u
          LEFT JOIN questions q
            ON q.unit_id = u.id
           AND q.in_subject_bank = TRUE
           AND q.subject_id = $1
          WHERE u.subject_id = $1
          GROUP BY u.id
          ORDER BY u.order_no ASC, u.created_at ASC
          `,
          [subjectId],
        );

  return result.rows;
}

export async function findUnitByName(db, subjectId, name, excludeId = null) {
  const result =
    excludeId == null
      ? await db.query(`SELECT id FROM units WHERE subject_id = $1 AND name = $2`, [subjectId, name])
      : await db.query(
          `SELECT id FROM units WHERE subject_id = $1 AND name = $2 AND id != $3`,
          [subjectId, name, excludeId],
        );

  return result.rows[0] ?? null;
}

export async function getNextUnitOrder(db, subjectId) {
  const result = await db.query(
    `SELECT MAX(order_no) AS max_order FROM units WHERE subject_id = $1`,
    [subjectId],
  );

  return (result.rows[0].max_order || 0) + 1;
}

export async function insertUnit(db, { subjectId, name, orderNo, createdBy }) {
  const result = await db.query(
    `
    INSERT INTO units (subject_id, name, order_no, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, order_no, created_at
    `,
    [subjectId, name, orderNo, createdBy],
  );

  return result.rows[0];
}

export async function getUnitSubjectId(db, unitId) {
  const result = await db.query(`SELECT subject_id FROM units WHERE id = $1`, [unitId]);
  return result.rows[0]?.subject_id ?? null;
}

export async function updateUnitName(db, unitId, name) {
  const result = await db.query(
    `UPDATE units SET name = $1 WHERE id = $2 RETURNING id, name, order_no, created_at`,
    [name, unitId],
  );

  return result.rows[0];
}

// Detach a unit's questions from the bank before deleting the unit (ON DELETE SET NULL
// only clears unit_id; in_subject_bank must be reset explicitly).
export async function detachUnitQuestions(db, unitId) {
  await db.query(
    `UPDATE questions SET in_subject_bank = FALSE, unit_id = NULL WHERE unit_id = $1`,
    [unitId],
  );
}

export async function deleteUnit(db, unitId) {
  await db.query(`DELETE FROM units WHERE id = $1`, [unitId]);
}

export async function listUnitBankQuestions(db, unitId, limit, offset) {
  const result = await db.query(
    `
    SELECT id, subject_id, question_text, option_a, option_b, option_c, option_d,
           correct_option, has_equation, allow_multiple_answers, points, is_required,
           created_by, created_at, unit_id, in_subject_bank,
           COUNT(*) OVER()::int AS total_count
    FROM questions
    WHERE unit_id = $1 AND in_subject_bank = TRUE
    ORDER BY created_at ASC
    LIMIT $2 OFFSET $3
    `,
    [unitId, limit, offset],
  );

  return result.rows;
}
