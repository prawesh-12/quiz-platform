-- Durable per-quiz question snapshot owned by the exam domain. Holds the full question
-- set including correct_option (server-side scoring only; stripped before reaching a
-- student). Deliberately no foreign key to quizzes: this table is meant to live in the
-- exam service's own database, which cannot reference the quiz domain. quiz_version is
-- reserved for a future quizzes change-timestamp; freshness is currently driven by
-- explicit rebuild on activation and edit. Idempotent.
CREATE TABLE IF NOT EXISTS exam.quiz_snapshot (
  quiz_id      INT PRIMARY KEY,
  payload      JSONB NOT NULL,
  quiz_version TIMESTAMP,
  built_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
