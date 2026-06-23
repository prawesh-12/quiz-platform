import { Pool } from "pg";

import { readPositiveIntegerEnv } from "../utils/env.js";

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
pool.on("connect", (client) => {
  client.query(`SET statement_timeout = ${STATEMENT_TIMEOUT_MS}`).catch((error) => {
    console.error("Failed to set statement_timeout on new connection:", error);
  }); 
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export default pool;
