-- Question Bank service schema (public). Owns subjects, units, questions, plus a local
-- teacher_subjects read-model fed from the auth service's event stream. Idempotent
-- (IF NOT EXISTS) so a re-run is a no-op. created_by is a plain int with no FK because
-- teachers live in the auth service's own database.

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  order_no INT DEFAULT 1,
  created_by INT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (subject_id, name)
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  unit_id INT REFERENCES units(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT,
  option_d TEXT,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
  has_equation BOOLEAN DEFAULT FALSE,
  allow_multiple_answers BOOLEAN DEFAULT FALSE,
  points INT DEFAULT 1,
  is_required BOOLEAN DEFAULT TRUE,
  in_subject_bank BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Local read-model of subject ownership, projected from events:auth. teacher_id and
-- subject_id are plain ints with no FK (teachers are owned by the auth service).
CREATE TABLE IF NOT EXISTS teacher_subjects (
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  PRIMARY KEY (teacher_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_unit_id ON questions(unit_id);
CREATE INDEX IF NOT EXISTS idx_questions_in_subject_bank ON questions(in_subject_bank);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON teacher_subjects(subject_id);
