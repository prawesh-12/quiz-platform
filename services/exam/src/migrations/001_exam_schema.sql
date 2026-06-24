-- Exam service schema. Owns student sessions/answers/violations and the durable quiz
-- snapshot in public. quizzes/subjects are read-model projections fed by events; no
-- cross-service foreign keys. Idempotent (IF NOT EXISTS) so re-runs are no-ops.

CREATE TABLE IF NOT EXISTS quizzes (
  id              INT PRIMARY KEY,
  title           VARCHAR(255),
  subject_id      INT,
  created_by      INT,
  duration_mins   INT,
  batch           VARCHAR(50),
  division        VARCHAR(10),
  group_nos       VARCHAR(50),
  status          VARCHAR(20),
  quiz_date       DATE,
  scheduled_start TIMESTAMP,
  scheduled_end   TIMESTAMP,
  access_code     VARCHAR(20),
  access_token    VARCHAR(32),
  created_at      TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
  id         INT PRIMARY KEY,
  name       TEXT,
  created_by INT
);

CREATE TABLE IF NOT EXISTS quiz_snapshot (
  quiz_id      INT PRIMARY KEY,
  payload      JSONB NOT NULL,
  quiz_version TIMESTAMP,
  built_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_sessions (
  id SERIAL PRIMARY KEY,
  quiz_id INT,
  name VARCHAR(100) NOT NULL,
  roll_no VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL,
  division VARCHAR(10) NOT NULL,
  group_no VARCHAR(10) NOT NULL,
  session_token VARCHAR(64) UNIQUE NOT NULL,
  submission_id VARCHAR(64),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted')),
  score INT,
  total_points INT,
  started_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP
);

-- question_id is a plain INT (membership row id), deliberately no FK to the quiz domain.
CREATE TABLE IF NOT EXISTS student_answers (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES student_sessions(id) ON DELETE CASCADE,
  question_id INT,
  selected_option CHAR(1) CHECK (selected_option IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN,
  answered_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS violation_flags (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES student_sessions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  occurred_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_sessions_quiz_id ON student_sessions(quiz_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_sessions_session_token ON student_sessions(session_token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_answers_session_question_unique
  ON student_answers(session_id, question_id);
CREATE INDEX IF NOT EXISTS idx_violation_flags_session_id ON violation_flags(session_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_access_token ON quizzes(access_token);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON quizzes(subject_id);
