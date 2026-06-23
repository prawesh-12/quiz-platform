-- Read-model tables rebuilt purely from events. No cross-service FKs.

CREATE TABLE IF NOT EXISTS quizzes (
  id           INTEGER PRIMARY KEY,
  created_by   INTEGER,
  subject_id   INTEGER,
  title        TEXT,
  status       TEXT,
  quiz_date    DATE,
  created_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes (created_by);

CREATE TABLE IF NOT EXISTS subjects (
  id    INTEGER PRIMARY KEY,
  name  TEXT
);

CREATE TABLE IF NOT EXISTS student_sessions (
  id            INTEGER PRIMARY KEY,
  quiz_id       INTEGER,
  name          TEXT,
  roll_no       TEXT,
  email         TEXT,
  division      TEXT,
  group_no      TEXT,
  started_at    TIMESTAMPTZ,
  submitted_at  TIMESTAMPTZ,
  score         INTEGER,
  total_points  INTEGER,
  status        TEXT
);

CREATE INDEX IF NOT EXISTS idx_student_sessions_quiz_id ON student_sessions (quiz_id);

CREATE TABLE IF NOT EXISTS violation_flags (
  session_id  INTEGER PRIMARY KEY,
  quiz_id     INTEGER
);

CREATE INDEX IF NOT EXISTS idx_violation_flags_quiz_id ON violation_flags (quiz_id);
