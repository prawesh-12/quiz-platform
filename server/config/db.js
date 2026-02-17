import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
