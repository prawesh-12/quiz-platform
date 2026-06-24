import { Pool } from "pg";

// Read-only detection pool; owns no tables and qualifies names, so it needs no search_path.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.SCHEDULER_PG_POOL_MAX || 4),
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 3000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (error) => {
  process.stderr.write(`${JSON.stringify({ level: "error", event: "scheduler.pg_pool_error", message: error?.message })}\n`);
});

export function query(text, params = []) {
  return pool.query(text, params);
}

export default pool;
