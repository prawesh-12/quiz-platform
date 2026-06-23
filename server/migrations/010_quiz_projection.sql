-- quizzes metadata read-model (no questions), fed by quiz events. Bare "quizzes" joins
-- resolve here since public sorts first in search_path. Idempotent.
CREATE TABLE IF NOT EXISTS public.quizzes (
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

CREATE INDEX IF NOT EXISTS quizzes_access_token_idx ON public.quizzes (access_token);
CREATE INDEX IF NOT EXISTS quizzes_subject_idx ON public.quizzes (subject_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'quiz' AND table_name = 'quizzes') THEN
    INSERT INTO public.quizzes (
      id, title, subject_id, created_by, duration_mins, batch, division, group_nos,
      status, quiz_date, scheduled_start, scheduled_end, access_code, access_token, created_at
    )
    SELECT
      id, title, subject_id, created_by, duration_mins, batch, division, group_nos,
      status, quiz_date, scheduled_start, scheduled_end, access_code, access_token, created_at
    FROM quiz.quizzes
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Sessions referenced the authoritative quizzes table, which is leaving this database.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_sessions_quiz_id_fkey') THEN
    ALTER TABLE exam.student_sessions DROP CONSTRAINT student_sessions_quiz_id_fkey;
  END IF;
END $$;
