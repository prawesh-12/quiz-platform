-- Brings legacy databases up to the current shape and applies scaling columns/indexes.
-- All statements are idempotent, so this is a no-op on a database freshly built from
-- the base schema.

-- Teacher columns (legacy DBs predate these).
ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS school VARCHAR(10),
  ADD COLUMN IF NOT EXISTS contact_no VARCHAR(20),
  ADD COLUMN IF NOT EXISTS avatar_data BYTEA,
  ADD COLUMN IF NOT EXISTS avatar_mime VARCHAR(20),
  ADD COLUMN IF NOT EXISTS has_avatar BOOLEAN DEFAULT FALSE;

ALTER TABLE teachers
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS avatar_url;

-- Backfill has_avatar from any existing avatar data.
UPDATE teachers
SET has_avatar = (avatar_data IS NOT NULL)
WHERE has_avatar IS DISTINCT FROM (avatar_data IS NOT NULL);

-- Quiz scheduling columns.
ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMP,
  ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMP,
  ADD COLUMN IF NOT EXISTS access_code VARCHAR(20);

-- Replace the old users_* check constraints with the teachers_school_check.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint
             WHERE conname = 'users_role_check' AND conrelid = 'teachers'::regclass) THEN
    ALTER TABLE teachers DROP CONSTRAINT users_role_check;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint
             WHERE conname = 'users_school_check' AND conrelid = 'teachers'::regclass) THEN
    ALTER TABLE teachers DROP CONSTRAINT users_school_check;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'teachers_school_check' AND conrelid = 'teachers'::regclass) THEN
    ALTER TABLE teachers
      ADD CONSTRAINT teachers_school_check CHECK (school IN ('SOT', 'SLS', 'SOET'));
  END IF;
END $$;

-- Answer-upsert arbiter; created before dropping the old constraint so the ON CONFLICT
-- target never disappears.
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_answers_session_question_unique
  ON student_answers(session_id, question_id);

ALTER TABLE student_answers
  DROP CONSTRAINT IF EXISTS student_answers_session_id_question_id_key;
DROP INDEX IF EXISTS idx_student_answers_session_id;
DROP INDEX IF EXISTS idx_student_sessions_quiz_id;

-- Idempotent submission id (legacy DBs predate it).
ALTER TABLE student_sessions
  ADD COLUMN IF NOT EXISTS submission_id VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_sessions_submission_id
  ON student_sessions (submission_id) WHERE submission_id IS NOT NULL;

-- Scaling indexes (also in the base schema; idempotent here for legacy DBs).
CREATE INDEX IF NOT EXISTS idx_student_sessions_quiz_status ON student_sessions(quiz_id, status);
CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled_start ON quizzes(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled_end ON quizzes(scheduled_end);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by_status ON quizzes(created_by, status);
CREATE INDEX IF NOT EXISTS idx_quizzes_access_token_status ON quizzes(access_token, status);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON teacher_subjects(subject_id);
