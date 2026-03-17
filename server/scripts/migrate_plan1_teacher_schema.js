import "dotenv/config";

import pool from "../config/db.js";

async function migratePlan1TeacherSchema() {
  const client = await pool.connect();

  try {
    console.log("Starting Plan 1 migration...");
    await client.query("BEGIN");

    await client.query(`
      DO $$
      BEGIN
        IF to_regclass('public.users') IS NOT NULL
           AND to_regclass('public.teachers') IS NULL THEN
          ALTER TABLE users RENAME TO teachers;
        END IF;
      END $$;
    `);

    const tableCheck = await client.query(`
      SELECT to_regclass('public.teachers') AS teachers_table;
    `);

    if (!tableCheck.rows[0]?.teachers_table) {
      throw new Error("Neither 'users' nor 'teachers' table exists.");
    }

    await client.query(`
      ALTER TABLE teachers
      ADD COLUMN IF NOT EXISTS school VARCHAR(10);
    `);

    await client.query(`
      ALTER TABLE teachers
      ADD COLUMN IF NOT EXISTS contact_no VARCHAR(20);
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'teachers_school_check'
            AND conrelid = 'teachers'::regclass
        ) THEN
          ALTER TABLE teachers
          ADD CONSTRAINT teachers_school_check
          CHECK (school IN ('SOT', 'SLS', 'SOET'));
        END IF;
      END $$;
    `);

    await client.query(`
      ALTER TABLE teachers
      DROP COLUMN IF EXISTS role;
    `);

    await client.query(`
      ALTER TABLE teachers
      DROP COLUMN IF EXISTS avatar_url;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS teacher_subjects (
        id SERIAL PRIMARY KEY,
        teacher_id INT REFERENCES teachers(id) ON DELETE CASCADE,
        subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (teacher_id, subject_id)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id
      ON teacher_subjects(teacher_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id
      ON teacher_subjects(subject_id);
    `);

    await client.query("COMMIT");
    console.log("Plan 1 migration completed successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Plan 1 migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migratePlan1TeacherSchema();
