import { Pool } from "pg";

import { readPositiveIntegerEnv } from "../utils/env.js";
import logger, { serializeError } from "../utils/logger.js";
import { measure } from "../utils/requestTiming.js";

const STATEMENT_TIMEOUT_MS = readPositiveIntegerEnv("PG_STATEMENT_TIMEOUT_MS", 15000);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: readPositiveIntegerEnv("PG_POOL_MAX", 20),
  idleTimeoutMillis: readPositiveIntegerEnv("PG_POOL_IDLE_TIMEOUT_MS", 30000),
  connectionTimeoutMillis: readPositiveIntegerEnv("PG_POOL_CONNECTION_TIMEOUT_MS", 15000),
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

const CONNECT_RETRY_DELAY_MS = 500;

// pg reports a cold-start connect failure with no error code, only this text.
function isConnectTimeout(error) {
  const message = String(error?.message || "");
  return (
    message.includes("timeout exceeded when trying to connect") ||
    message.includes("Connection terminated due to connection timeout")
  );
}

// A cold-start connect never reached the server, so one retry is safe even for writes.
async function retryOnConnectTimeout(run) {
  try {
    return await run();
  } catch (error) {
    if (!isConnectTimeout(error)) {
      throw error;
    }
    logger.warn("db.connect_retry", serializeError(error));
    await new Promise((resolve) => setTimeout(resolve, CONNECT_RETRY_DELAY_MS));
    return run();
  }
}

// Time every pooled query against the active request (no-op outside a request). Repositories
// call pool.query directly, so wrap it at the source rather than only the helper below.
const runQuery = pool.query.bind(pool);
pool.query = (...args) => measure("db", () => retryOnConnectTimeout(() => runQuery(...args)));

// withTransaction takes this path, so it needs the same retry.
const openClient = pool.connect.bind(pool);
pool.connect = (...args) => retryOnConnectTimeout(() => openClient(...args));

export async function query(text, params = []) {
  return pool.query(text, params);
}

export default pool;
