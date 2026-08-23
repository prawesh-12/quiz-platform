import "./load-env.js";

import pool from "./src/db.js";
import { closeRedis } from "./src/redis.js";
import { runDetectionTick } from "./src/detect.js";
import logger, { serializeError } from "./src/logger.js";
import { readPositiveIntegerEnv, validateRequiredEnv } from "./src/utils/env.js";

validateRequiredEnv();

const DEFAULT_TICK_MS = 1000;
const TICK_MS = readPositiveIntegerEnv("SCHEDULER_TICK_MS", DEFAULT_TICK_MS);

let inFlight = false;
const timer = setInterval(async () => {
  if (inFlight) {
    return;
  }
  inFlight = true;
  try {
    await runDetectionTick();
  } finally {
    inFlight = false;
  }
}, TICK_MS);

logger.info("scheduler.started", { tickMs: TICK_MS });

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  logger.info("scheduler.shutting_down", { signal });
  clearInterval(timer);
  await closeRedis();
  await pool.end().catch((error) => logger.warn("scheduler.pool_close_failed", serializeError(error)));
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
