// Data access for the internal bank-selection endpoint used by the monolith's
// auto-generate flow. Each function takes a `db` (the pool or a transaction client).

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

// Randomly picks `count` bank questions with full content for the unit/subject.
export async function pickRandomBankQuestions(db, unitId, subjectId, count) {
  const result = await db.query(
    `
    SELECT id, question_text, option_a, option_b, option_c, option_d,
           correct_option, has_equation, allow_multiple_answers, points, is_required
    FROM questions
    WHERE unit_id = $1 AND in_subject_bank = TRUE AND subject_id = $2
    ORDER BY RANDOM()
    LIMIT $3
    `,
    [unitId, subjectId, count],
  );

  return result.rows;
}
