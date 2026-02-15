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
    CREATE UNIQUE INDEX IF NOT EXISTS idx_student_answers_session_question_unique
    ON student_answers(session_id, question_id)
  `);

  await query("CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled_start ON quizzes(scheduled_start)");
  await query("CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled_end ON quizzes(scheduled_end)");
} catch (error) {
  console.error("Failed to connect to PostgreSQL. Check DATABASE_URL and PostgreSQL service.");
  console.error(error);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

startQuizScheduler();
