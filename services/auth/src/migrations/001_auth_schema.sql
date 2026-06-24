-- Auth service schema (public). Owns teachers, revoked_tokens, teacher_subjects.
-- Idempotent (IF NOT EXISTS) so a re-run is a no-op. subject_id is a plain int with no
-- FK because subjects live in the questionbank service's own database.

CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  plain_password VARCHAR(255),
  school VARCHAR(10) CHECK (school IN ('SOT', 'SLS', 'SOET')),
  contact_no VARCHAR(20),
  avatar_data BYTEA,
  avatar_mime VARCHAR(20),
  has_avatar BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revoked_tokens (
  id SERIAL PRIMARY KEY,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  user_id INT REFERENCES teachers(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teacher_subjects (
  id SERIAL PRIMARY KEY,
  teacher_id INT REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (teacher_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON teacher_subjects(subject_id);
