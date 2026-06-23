// Data access for questions. Each function takes a `db` (the pool or a transaction client).

const QUESTION_COLUMNS = `
  id, subject_id, question_text, option_a, option_b, option_c, option_d,
  correct_option, has_equation, allow_multiple_answers, points, is_required,
  created_by, created_at, unit_id, in_subject_bank
`;

// Columns a teacher may patch via updateQuestion. Whitelisted so callers cannot
// build SET clauses for arbitrary columns.
const UPDATABLE_COLUMNS = new Set([
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_option",
  "points",
  "has_equation",
  "allow_multiple_answers",
  "is_required",
  "unit_id",
  "in_subject_bank",
]);

export async function insertQuestion(db, question) {
  const result = await db.query(
    `
    INSERT INTO questions (
      subject_id, question_text, option_a, option_b, option_c, option_d,
      correct_option, has_equation, allow_multiple_answers, points, is_required, created_by,
      unit_id, in_subject_bank
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING ${QUESTION_COLUMNS}
    `,
    [
      question.subject_id,
      question.question_text,
      question.option_a,
      question.option_b,
      question.option_c ?? null,
      question.option_d ?? null,
      question.correct_option,
      question.has_equation,
      question.allow_multiple_answers,
      question.points,
      question.is_required,
      question.created_by,
      question.unit_id ?? null,
      question.in_subject_bank ?? false,
    ],
  );

  return result.rows[0];
}

export async function listQuestions(db, { subjectId, search, limit, offset, inSubjectBankFilter, unitId }) {
  const params = [subjectId, search || null, limit, offset, inSubjectBankFilter];
  let unitFilter = "";

  if (unitId !== undefined) {
    if (unitId === null || unitId === -1) {
      unitFilter = "AND unit_id IS NULL";
    } else {
      params.push(unitId);
      unitFilter = `AND unit_id = $${params.length}`;
    }
  }

  const result = await db.query(
    `
    SELECT id, subject_id, question_text, option_a, option_b, option_c, option_d,
           correct_option, has_equation, allow_multiple_answers, points, is_required,
           created_by, created_at, unit_id, in_subject_bank,
           COUNT(*) OVER()::int AS total_count
    FROM questions
    WHERE subject_id = $1
      AND ($2::text IS NULL OR question_text ILIKE '%' || $2 || '%')
      AND ($5::boolean IS NULL OR in_subject_bank = $5)
      ${unitFilter}
    ORDER BY created_at DESC, id DESC
    LIMIT $3 OFFSET $4
    `,
    params,
  );

  return result.rows;
}

export async function updateQuestionColumns(db, questionId, userId, patch) {
  const updates = [];
  const values = [];
  let position = 1;

  for (const [column, value] of Object.entries(patch)) {
    if (!UPDATABLE_COLUMNS.has(column)) {
      continue;
    }
    updates.push(`${column} = $${position}`);
    values.push(value ?? null);
    position += 1;
  }

  values.push(questionId, userId);
  const result = await db.query(
    `
    UPDATE questions
    SET ${updates.join(", ")}
    WHERE id = $${position} AND created_by = $${position + 1}
    RETURNING id, subject_id, question_text, option_a, option_b, option_c, option_d,
              correct_option, has_equation, allow_multiple_answers, points, is_required,
              created_by, created_at
    `,
    values,
  );

  return result.rows[0] ?? null;
}

export async function deleteQuestion(db, questionId, userId) {
  const result = await db.query(
    `DELETE FROM questions WHERE id = $1 AND created_by = $2 RETURNING id`,
    [questionId, userId],
  );

  return result.rows[0] ?? null;
}
