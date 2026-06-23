// Admin-facing reads over content. created_by_name resolves against the local teachers
// projection fed by the auth service.

export async function findAllSubjectsWithCounts(db) {
  const result = await db.query(
    `
    SELECT s.*, COUNT(q.id)::int AS question_count
    FROM subjects s
    LEFT JOIN questions q ON q.subject_id = s.id
    GROUP BY s.id
    ORDER BY s.name
    `,
  );

  return result.rows;
}

export async function findSubjectQuestionsForAdmin(db, subjectId) {
  const result = await db.query(
    `
    SELECT q.*, u.name AS unit_name, t.name AS created_by_name
    FROM questions q
    LEFT JOIN units u ON u.id = q.unit_id
    LEFT JOIN teachers t ON t.id = q.created_by
    WHERE q.subject_id = $1
    ORDER BY q.created_at DESC
    `,
    [subjectId],
  );

  return result.rows;
}
