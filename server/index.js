import dotenv from "dotenv";

dotenv.config();

const [{ default: app }, { JWT_SECRET }, { query }, { startQuizScheduler }] = await Promise.all([
  import("./app.js"),
  import("./config/jwt.js"),
  import("./config/db.js"),
  import("./services/quizScheduler.service.js")
]);

const PORT = Number(process.env.PORT || 5000);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

try {
  await query("SELECT 1");

  // One-way compatibility: rename legacy users table if needed.
  await query(`
    DO $$
    BEGIN
      IF to_regclass('public.users') IS NOT NULL
         AND to_regclass('public.teachers') IS NULL THEN
        ALTER TABLE users RENAME TO teachers;
      END IF;
    END $$;
  `);

  await query(`
    ALTER TABLE teachers
    ADD COLUMN IF NOT EXISTS school VARCHAR(10),
    ADD COLUMN IF NOT EXISTS contact_no VARCHAR(20),
    ADD COLUMN IF NOT EXISTS avatar_data BYTEA,
    ADD COLUMN IF NOT EXISTS avatar_mime VARCHAR(20),
    ADD COLUMN IF NOT EXISTS has_avatar BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255);
  `);

  await query(`
    ALTER TABLE teachers
    DROP COLUMN IF EXISTS role,
    DROP COLUMN IF EXISTS avatar_url;
  `);

  await query(`
    ALTER TABLE quizzes
    ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMP,
    ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMP,
    ADD COLUMN IF NOT EXISTS access_code VARCHAR(20);
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_role_check'
          AND conrelid = 'teachers'::regclass
      ) THEN
        ALTER TABLE teachers DROP CONSTRAINT users_role_check;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_school_check'
          AND conrelid = 'teachers'::regclass
      ) THEN
        ALTER TABLE teachers DROP CONSTRAINT users_school_check;
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'teachers_school_check'
          AND conrelid = 'teachers'::regclass
      ) THEN
        ALTER TABLE teachers
        ADD CONSTRAINT teachers_school_check CHECK (school IN ('SOT', 'SLS', 'SOET'));
      END IF;
    END $$;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      id SERIAL PRIMARY KEY,
      token_hash VARCHAR(64) UNIQUE NOT NULL,
      user_id INT REFERENCES teachers(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS teacher_subjects (
      id SERIAL PRIMARY KEY,
      teacher_id INT REFERENCES teachers(id) ON DELETE CASCADE,
      subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
      assigned_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (teacher_id, subject_id)
    );
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_student_answers_session_question_unique
    ON student_answers(session_id, question_id);
  `);

  // Drop indexes now made redundant by the unique index created above (created first so
  // the answer-upsert ON CONFLICT never loses its arbiter when the old constraint goes).
  await query(`
    ALTER TABLE student_answers
    DROP CONSTRAINT IF EXISTS student_answers_session_id_question_id_key;
  `);
  await query(`DROP INDEX IF EXISTS idx_student_answers_session_id;`);
  await query(`DROP INDEX IF EXISTS idx_student_sessions_quiz_id;`);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_student_sessions_quiz_status
    ON student_sessions(quiz_id, status);
  `);

  await query(`
    ALTER TABLE student_sessions
    ADD COLUMN IF NOT EXISTS submission_id VARCHAR(64);
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_student_sessions_submission_id
    ON student_sessions (submission_id)
    WHERE submission_id IS NOT NULL;
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled_start ON quizzes(scheduled_start);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled_end ON quizzes(scheduled_end);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_quizzes_created_by_status
    ON quizzes(created_by, status);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_quizzes_access_token_status
    ON quizzes(access_token, status);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON teacher_subjects(teacher_id);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON teacher_subjects(subject_id);
  `);
} catch (error) {
  console.error("Failed to connect to PostgreSQL. Check DATABASE_URL and PostgreSQL service.");
  console.error(error);
  process.exit(1);
}

await startQuizScheduler();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
