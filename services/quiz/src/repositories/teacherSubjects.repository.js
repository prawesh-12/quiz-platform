// Local read-model of teacher->subject assignments, projected from the auth event stream.
// Writes are upsert/delete so re-delivered events stay idempotent.

export async function assignTeacherSubject(db, teacherId, subjectId) {
  await db.query(
    `
    INSERT INTO teacher_subjects (teacher_id, subject_id)
    VALUES ($1, $2)
    ON CONFLICT (teacher_id, subject_id) DO NOTHING
    `,
    [teacherId, subjectId],
  );
}

export async function removeTeacherSubject(db, teacherId, subjectId) {
  await db.query(
    `DELETE FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2`,
    [teacherId, subjectId],
  );
}

export async function removeTeacher(db, teacherId) {
  await db.query(`DELETE FROM teacher_subjects WHERE teacher_id = $1`, [teacherId]);
}
