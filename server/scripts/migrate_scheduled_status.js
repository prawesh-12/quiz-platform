// This script was used to update the quizzes production db throough changing the .env variable DB_URL to production url and running cmd node scripts/migrate_scheduled_status.js


import "dotenv/config";
import pool from "../config/db.js";

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Starting migration: Update quiz status check constraint...");
    await client.query("BEGIN");
    
    // Find the constraint name
    const constraintResult = await client.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'quizzes'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%';
    `);

    if (constraintResult.rows.length > 0) {
        const constraintName = constraintResult.rows[0].conname;
        console.log(`Found existing constraint: ${constraintName}`);
        await client.query(`ALTER TABLE quizzes DROP CONSTRAINT "${constraintName}"`);
    } else {
        console.log("No existing status constraint found (or could not identify it).");
    }

    // Add the new constraint with a fixed name
    console.log("Adding new constraint 'quizzes_status_check'...");
    await client.query(`
      ALTER TABLE quizzes 
      ADD CONSTRAINT quizzes_status_check 
      CHECK (status IN ('draft', 'active', 'ended', 'scheduled'));
    `);
    
    await client.query("COMMIT");
    console.log("Migration successful: 'scheduled' status added to quizzes table.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
