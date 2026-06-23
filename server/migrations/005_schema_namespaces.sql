-- Give each domain its own schema so table ownership is explicit and a service can later
-- take its tables to a dedicated database. A permissive search_path (database default
-- below, plus a per-connection SET in config/db.js) keeps unqualified table names
-- resolving, so application queries stay unchanged. Idempotent.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS questionbank;
CREATE SCHEMA IF NOT EXISTS quiz;
CREATE SCHEMA IF NOT EXISTS exam;
CREATE SCHEMA IF NOT EXISTS analytics;

-- New sessions resolve unqualified names across every domain schema. public stays first
-- so infrastructure (schema_migrations) and any future unqualified CREATE land there.
DO $$
BEGIN
  EXECUTE format(
    'ALTER DATABASE %I SET search_path = public, auth, questionbank, quiz, exam, analytics',
    current_database()
  );
END $$;

-- Move each owned table into its schema only while it still lives in public, so a re-run
-- (or a fresh DB already namespaced) is a no-op rather than an error.
DO $$
DECLARE
  ownership CONSTANT text[][] := ARRAY[
    ['teachers', 'auth'],
    ['revoked_tokens', 'auth'],
    ['teacher_subjects', 'auth'],
    ['subjects', 'questionbank'],
    ['units', 'questionbank'],
    ['questions', 'questionbank'],
    ['quizzes', 'quiz'],
    ['quiz_questions', 'quiz'],
    ['student_sessions', 'exam'],
    ['student_answers', 'exam'],
    ['violation_flags', 'exam']
  ];
  entry text[];
BEGIN
  FOREACH entry SLICE 1 IN ARRAY ownership LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = entry[1]
    ) THEN
      EXECUTE format('ALTER TABLE public.%I SET SCHEMA %I', entry[1], entry[2]);
    END IF;
  END LOOP;
END $$;
