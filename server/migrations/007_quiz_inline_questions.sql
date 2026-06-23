-- Questions a teacher types while authoring a quiz are not reusable bank content; they
-- belong only to that quiz. Give them a quiz-owned table so quiz creation stays one local
-- transaction and the shared questions bank is written only on an explicit "save to bank".
-- quiz_questions becomes the single membership/ordering table pointing at exactly one
-- source (a bank question or an inline question); student_answers then key on the
-- membership row id so inline questions can be answered. Empty DB at rollout, so no data
-- migration. Idempotent.

CREATE TABLE IF NOT EXISTS quiz.quiz_inline_questions (
  id                     SERIAL PRIMARY KEY,
  quiz_id                INT NOT NULL REFERENCES quiz.quizzes(id) ON DELETE CASCADE,
  question_text          TEXT NOT NULL,
  option_a               TEXT NOT NULL,
  option_b               TEXT NOT NULL,
  option_c               TEXT,
  option_d               TEXT,
  correct_option         CHAR(1) NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
  has_equation           BOOLEAN NOT NULL DEFAULT FALSE,
  allow_multiple_answers BOOLEAN NOT NULL DEFAULT FALSE,
  points                 INT NOT NULL DEFAULT 1,
  is_required            BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS quiz_inline_questions_quiz_id_idx
  ON quiz.quiz_inline_questions (quiz_id);

-- A membership row references a bank question OR an inline question, never both.
ALTER TABLE quiz.quiz_questions
  ADD COLUMN IF NOT EXISTS inline_question_id INT
  REFERENCES quiz.quiz_inline_questions(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quiz_questions_source_check'
  ) THEN
    ALTER TABLE quiz.quiz_questions
      ADD CONSTRAINT quiz_questions_source_check
      CHECK ((question_id IS NOT NULL) <> (inline_question_id IS NOT NULL));
  END IF;
END $$;

-- Answers now identify a question by its membership row (quiz_questions.id) rather than a
-- bank question. Drop the old foreign key to questions and add none: exam will own this
-- table in its own database and must not reference the quiz domain.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'exam.student_answers'::regclass
      AND contype = 'f'
      AND conname = 'student_answers_question_id_fkey'
  ) THEN
    ALTER TABLE exam.student_answers DROP CONSTRAINT student_answers_question_id_fkey;
  END IF;
END $$;
