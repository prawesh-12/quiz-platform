-- Read-models fed by the auth service's events; bare-name joins resolve here since public
-- sorts first in search_path. No FK to the now-external teachers table. Idempotent.
CREATE TABLE IF NOT EXISTS public.teachers (
  id   INT PRIMARY KEY,
  name TEXT
);

CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL REFERENCES questionbank.subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, subject_id)
);

CREATE INDEX IF NOT EXISTS teacher_subjects_teacher_idx ON public.teacher_subjects (teacher_id);

-- Seed once from the old in-database auth tables if they are still present (empty on a
-- fresh database). Ongoing updates arrive as events.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'teachers') THEN
    INSERT INTO public.teachers (id, name)
    SELECT id, name FROM auth.teachers
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'teacher_subjects') THEN
    INSERT INTO public.teacher_subjects (teacher_id, subject_id)
    SELECT teacher_id, subject_id FROM auth.teacher_subjects
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
