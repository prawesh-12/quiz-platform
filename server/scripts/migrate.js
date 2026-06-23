import "dotenv/config";

import pool from "../config/db.js";
import { runMigrations } from "../config/migrations.js";
import logger, { serializeError } from "../utils/logger.js";

// Standalone migration runner for `npm run db:migrate`. The same runMigrations() also
// runs automatically on API/worker boot.
try {
  const result = await runMigrations();
  logger.info("db:migrate complete", result);
  await pool.end();
  process.exit(0);
} catch (error) {
  logger.error("db:migrate failed", serializeError(error));
  await pool.end().catch(() => {});
  process.exit(1);
}
