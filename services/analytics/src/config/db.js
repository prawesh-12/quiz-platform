import { Pool } from "pg";

import { readPositiveIntegerEnv } from "../utils/env.js";
import logger, { serializeError } from "../utils/logger.js";

const STATEMENT_TIMEOUT_MS = readPositiveIntegerEnv("PG_STATEMENT_TIMEOUT_MS", 15000);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: readPositiveIntegerEnv("PG_POOL_MAX", 20),
  idleTimeoutMillis: readPositiveIntegerEnv("PG_POOL_IDLE_TIMEOUT_MS", 10000),
  connectionTimeoutMillis: readPositiveIntegerEnv("PG_POOL_CONNECTION_TIMEOUT_MS", 3000),
  ssl:
    process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Bound every query so a single stuck statement cannot hold a pool connection forever.
// This service owns its tables in `public`, so no search_path override is needed.
pool.on("connect", (client) => {
  client
    .query(`SET statement_timeout = ${STATEMENT_TIMEOUT_MS}`)
    .catch((error) => {
      logger.error("db.connection_init_failed", serializeError(error));
    });
});

pool.on("error", (error) => {
  logger.error("db.pool_error", serializeError(error));
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export default pool;
