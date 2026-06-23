import { Pool } from "pg";

import { readPositiveIntegerEnv } from "../utils/env.js";

const STATEMENT_TIMEOUT_MS = readPositiveIntegerEnv("PG_STATEMENT_TIMEOUT_MS", 15000);

// Domain schemas resolve via search_path so unqualified table names keep working after
// tables are namespaced. public stays first so unqualified CREATE and schema_migrations
// land there. SET ignores schemas that do not exist yet, so this is safe before migration.
const SEARCH_PATH = "public, auth, questionbank, quiz, exam, analytics";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: readPositiveIntegerEnv("PG_POOL_MAX", 20),
  idleTimeoutMillis: readPositiveIntegerEnv("PG_POOL_IDLE_TIMEOUT_MS", 10000),
  connectionTimeoutMillis: readPositiveIntegerEnv("PG_POOL_CONNECTION_TIMEOUT_MS", 3000),
  ssl:
    process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Pin search_path and bound every query so a single stuck statement cannot hold a pool
// connection forever. SET takes no bind params; both values are static, not user input.
pool.on("connect", (client) => {
  client
    .query(`SET search_path TO ${SEARCH_PATH}; SET statement_timeout = ${STATEMENT_TIMEOUT_MS}`)
    .catch((error) => {
      console.error("Failed to initialize new connection:", error);
    });
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export default pool;
