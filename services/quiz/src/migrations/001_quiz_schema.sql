-- Quiz service schema (public). Owns quizzes, quiz_questions, quiz_inline_questions, plus
-- local read-models (subjects + teacher_subjects) fed from the questionbank and auth event
-- streams for subject authorization. Idempotent (IF NOT EXISTS) so a re-run is a no-op.
-- subject_id and created_by are plain ints with no FK because subjects and teachers live in
-- other services' databases. source_question_id is a plain int trace back to the bank.

CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subject_id INT,
  created_by INT,
  duration_mins INT NOT NULL DEFAULT 15,
  batch VARCHAR(50),
  division VARCHAR(10),
  group_nos VARCHAR(50),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended', 'scheduled')),
  quiz_date DATE,
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  access_code VARCHAR(20),
  access_token VARCHAR(32) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_inline_questions (
  id                     SERIAL PRIMARY KEY,
  quiz_id                INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text          TEXT NOT NULL,
  option_a               TEXT NOT NULL,
  option_b               TEXT NOT NULL,
  option_c               TEXT,
  option_d               TEXT,
  correct_option         CHAR(1) NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
  has_equation           BOOLEAN NOT NULL DEFAULT FALSE,
  allow_multiple_answers BOOLEAN NOT NULL DEFAULT FALSE,
  points                 INT NOT NULL DEFAULT 1,
  is_required            BOOLEAN NOT NULL DEFAULT TRUE,
  source_question_id     INT
);

-- A membership row references a bank question OR an inline question, never both.
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
  question_id INT,
  inline_question_id INT REFERENCES quiz_inline_questions(id) ON DELETE CASCADE,
  order_no INT,
  CONSTRAINT quiz_questions_source_check
    CHECK ((question_id IS NOT NULL) <> (inline_question_id IS NOT NULL))
);

-- Local read-model of subjects, projected from events:questionbank (subject.upserted /
-- subject.deleted). created_by is a plain int with no FK (teachers live in the auth service).
CREATE TABLE IF NOT EXISTS subjects (
  id         INT PRIMARY KEY,
  name       TEXT,
  created_by INT
);

-- Local read-model of subject ownership, projected from events:auth. teacher_id and
-- subject_id are plain ints with no FK (their authorities live in other services).
CREATE TABLE IF NOT EXISTS teacher_subjects (
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  PRIMARY KEY (teacher_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS quiz_inline_questions_quiz_id_idx ON quiz_inline_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled_start ON quizzes(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled_end ON quizzes(scheduled_end);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by_status ON quizzes(created_by, status);
CREATE INDEX IF NOT EXISTS idx_quizzes_access_token_status ON quizzes(access_token, status);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON teacher_subjects(subject_id);
