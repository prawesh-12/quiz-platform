-- Ensure quizzes.status allows 'scheduled'. Legacy DBs may carry an older status check
-- constraint (possibly auto-named) without it; drop any status check and add the
-- canonical one. Idempotent.
DO $$
DECLARE
  con_name text;
BEGIN
  FOR con_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'quizzes'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE quizzes DROP CONSTRAINT %I', con_name);
  END LOOP;

  ALTER TABLE quizzes
    ADD CONSTRAINT quizzes_status_check
    CHECK (status IN ('draft', 'active', 'ended', 'scheduled'));
END $$;
