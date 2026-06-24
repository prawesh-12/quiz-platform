import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pool from "./db.js";
import logger, { serializeError } from "../utils/logger.js";

// Advisory-lock key so only one process applies migrations at a time (safe across
// concurrent boots / the db:migrate CLI). Applied versions are tracked in
// schema_migrations; every migration file is idempotent.
const MIGRATION_LOCK_KEY = 4927015;
const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../migrations");

// The whole run executes in one transaction guarded by a transaction-scoped advisory
// lock (pooler-safe: pinned to one backend, auto-releases on COMMIT/ROLLBACK). Postgres
// DDL is transactional, so the run is also all-or-nothing.
export async function runMigrations() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL statement_timeout = 0");
    await client.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_LOCK_KEY]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((name) => name.endsWith(".sql"))
      .sort();

    const appliedRows = await client.query("SELECT version FROM schema_migrations");
    const applied = new Set(appliedRows.rows.map((row) => row.version));

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        continue;
      }

      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
      count += 1;
      logger.info("migration.applied", { version: file });
    }

    await client.query("COMMIT");
    logger.info("migrations.completed", { applied: count, total: files.length });
    return { applied: count, total: files.length };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    logger.error("migrations.failed", serializeError(error));
    throw error;
  } finally {
    client.release();
  }
}

// Allow `node src/config/migrations.js` as the db:migrate entrypoint.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
