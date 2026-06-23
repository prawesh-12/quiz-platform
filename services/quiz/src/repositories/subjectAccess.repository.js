import pool from "../config/db.js";

// Subject authorization over the local read-models (subjects + teacher_subjects). A
// teacher owns a subject if they created it or have been assigned to it.
export async function subjectBelongsToTeacher(subjectId, userId) {
  const result = await pool.query(
    `
    SELECT s.id
    FROM subjects s
    LEFT JOIN teacher_subjects ts ON ts.subject_id = s.id AND ts.teacher_id = $2
    WHERE s.id = $1 AND (s.created_by = $2 OR ts.teacher_id = $2)
    `,
    [subjectId, userId],
  );

  return result.rowCount > 0;
}
