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

  await query(`
    ALTER TABLE quizzes
    ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMP,
    ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMP,
    ADD COLUMN IF NOT EXISTS access_code VARCHAR(20)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS revoked_tokens (
      id SERIAL PRIMARY KEY,
      token_hash VARCHAR(64) UNIQUE NOT NULL,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      revoked_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await query(`
    DO $$
    DECLARE
      per_owner_constraint TEXT;
    BEGIN
      SELECT con.conname
      INTO per_owner_constraint
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'subjects'
        AND con.contype = 'u'
        AND pg_get_constraintdef(con.oid) = 'UNIQUE (created_by, name)'
      LIMIT 1;

      IF per_owner_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE subjects DROP CONSTRAINT %I', per_owner_constraint);
      END IF;
    END $$;
  `);

  await query(`DROP INDEX IF EXISTS idx_subjects_created_by_name_unique`);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_student_answers_session_question_unique
    ON student_answers(session_id, question_id)
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'subjects'
          AND con.contype = 'u'
          AND pg_get_constraintdef(con.oid) = 'UNIQUE (name)'
      ) THEN
        ALTER TABLE subjects ADD CONSTRAINT subjects_name_key UNIQUE (name);
      END IF;
    END $$;
  `);
  await query("CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled_start ON quizzes(scheduled_start)");
  await query("CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled_end ON quizzes(scheduled_end)");
  await query("CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at)");
} catch (error) {
  console.error("Failed to connect to PostgreSQL. Check DATABASE_URL and PostgreSQL service.");
  console.error(error);
  process.exit(1);
}

await startQuizScheduler();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
