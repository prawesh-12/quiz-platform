// Data access for quiz response listings. Each function takes a `db` (the pool or a
// transaction client).

export async function findQuizForOwner(db, quizId, userId) {
  const result = await db.query(
    `
    SELECT q.id, q.title, q.subject_id, s.name AS subject_name, q.duration_mins,
           q.status, q.quiz_date, q.created_at
    FROM quizzes q
    LEFT JOIN subjects s ON s.id = q.subject_id
    WHERE q.id = $1 AND q.created_by = $2
    `,
    [quizId, userId],
  );

  return result.rows[0] ?? null;
}

export async function findSessionResponseRows(db, quizId, limit, offset) {
  const result = await db.query(
    `
    SELECT
      ss.id AS session_id, ss.name, ss.roll_no, ss.email, ss.division, ss.group_no,
      ss.status, ss.score, ss.total_points, ss.started_at, ss.submitted_at,
      COUNT(vf.id)::int AS total_violations,
      COUNT(*) FILTER (WHERE vf.type = 'tab_switch')::int AS tab_switch_count,
      COUNT(*) FILTER (WHERE vf.type = 'window_blur')::int AS window_blur_count,
      COUNT(*) FILTER (WHERE vf.type = 'screenshot_attempt')::int AS screenshot_attempt_count,
      COUNT(*) FILTER (WHERE vf.type = 'copy_shortcut')::int AS copy_shortcut_count,
      COUNT(*) FILTER (WHERE vf.type = 'copy_event')::int AS copy_event_count,
      COUNT(*) FILTER (WHERE vf.type = 'context_menu')::int AS context_menu_count,
      COUNT(*) OVER()::int AS total_count
    FROM student_sessions ss
    LEFT JOIN violation_flags vf ON vf.session_id = ss.id
    WHERE ss.quiz_id = $1
    GROUP BY ss.id
    ORDER BY ss.started_at DESC, ss.id DESC
    LIMIT $2 OFFSET $3
    `,
    [quizId, limit, offset],
  );

  return result.rows;
}
