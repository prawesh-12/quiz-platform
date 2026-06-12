import { Pool } from "pg";

import { readPositiveIntegerEnv } from "../utils/env.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: readPositiveIntegerEnv("PG_POOL_MAX", 20),
  idleTimeoutMillis: readPositiveIntegerEnv("PG_POOL_IDLE_TIMEOUT_MS", 10000),
  connectionTimeoutMillis: readPositiveIntegerEnv("PG_POOL_CONNECTION_TIMEOUT_MS", 3000),
  ssl:
    process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export default pool;
