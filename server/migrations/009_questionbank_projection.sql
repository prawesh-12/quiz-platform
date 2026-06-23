-- subjects read-model (display + quiz authorization), fed by questionbank events. Bare
-- "subjects" joins resolve here since public sorts first in search_path. Idempotent.
CREATE TABLE IF NOT EXISTS public.subjects (
  id         INT PRIMARY KEY,
  name       TEXT,
  created_by INT
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'questionbank' AND table_name = 'subjects') THEN
    INSERT INTO public.subjects (id, name, created_by)
    SELECT id, name, created_by FROM questionbank.subjects
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Re-point the teacher_subjects read-model at the local subjects read-model now that the
-- authoritative subjects table is leaving this database.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_subjects_subject_id_fkey') THEN
    ALTER TABLE public.teacher_subjects DROP CONSTRAINT teacher_subjects_subject_id_fkey;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_subjects_subject_projection_fkey') THEN
    ALTER TABLE public.teacher_subjects
      ADD CONSTRAINT teacher_subjects_subject_projection_fkey
      FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Bank questions copied into a quiz trace their origin for an explicit save-to-bank later.
ALTER TABLE quiz.quiz_inline_questions
  ADD COLUMN IF NOT EXISTS source_question_id INT;
