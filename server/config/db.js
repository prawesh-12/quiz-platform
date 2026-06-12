import { Pool } from "pg";

function readPositiveIntegerEnv(name, fallback) {
  const rawValue = process.env[name];

  if (rawValue == null || rawValue === "") {
    return fallback;
  }

  const value = Number(rawValue);
  if (Number.isInteger(value) && value > 0) {
    return value;
  }

  console.warn(`Invalid ${name} value "${rawValue}". Falling back to ${fallback}.`);
  return fallback;
}

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
