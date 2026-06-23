-- Legacy compatibility: rename the old `users` table to `teachers` BEFORE the base
-- schema creates a fresh `teachers` (which would otherwise orphan legacy data).
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL
     AND to_regclass('public.teachers') IS NULL THEN
    ALTER TABLE users RENAME TO teachers;
  END IF;
END $$;
