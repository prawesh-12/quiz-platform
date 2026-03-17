import "dotenv/config";

import pool from "../config/db.js";

async function migratePlan14AvatarSchema() {
  const client = await pool.connect();

  try {
    console.log("Starting Plan 14 avatar schema migration...");
    await client.query("BEGIN");

    await client.query(`
      ALTER TABLE teachers
      DROP COLUMN IF EXISTS avatar_url;
    `);

    await client.query(`
      ALTER TABLE teachers
      ADD COLUMN IF NOT EXISTS avatar_data BYTEA,
      ADD COLUMN IF NOT EXISTS avatar_mime VARCHAR(20),
      ADD COLUMN IF NOT EXISTS has_avatar BOOLEAN DEFAULT FALSE;
    `);

    await client.query(`
      UPDATE teachers
      SET has_avatar = CASE WHEN avatar_data IS NULL THEN FALSE ELSE TRUE END
      WHERE has_avatar IS DISTINCT FROM CASE WHEN avatar_data IS NULL THEN FALSE ELSE TRUE END;
    `);

    await client.query("COMMIT");
    console.log("Plan 14 avatar schema migration completed successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Plan 14 avatar schema migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migratePlan14AvatarSchema();
