-- Dashboard aggregates filter/group student_sessions by started_at and join on quiz_id.
-- violation_flags(session_id) is already the PRIMARY KEY, so it needs no separate index.
CREATE INDEX IF NOT EXISTS idx_student_sessions_started_at
  ON student_sessions (started_at);

CREATE INDEX IF NOT EXISTS idx_student_sessions_quiz_started
  ON student_sessions (quiz_id, started_at);
