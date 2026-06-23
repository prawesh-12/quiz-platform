import Redis from "ioredis";

import logger, { serializeError } from "../utils/logger.js";

// Optional cache/coordination layer. Unset REDIS_URL → no-op (callers fall back to
// PostgreSQL). Unreachable → commands fail fast (offline queue off) instead of hanging.

const REDIS_URL = process.env.REDIS_URL || "";
const RETRY_STEP_MS = 200;
const RETRY_MAX_MS = 5000;

let client = null;
let ready = false;

if (REDIS_URL) {
  client = new Redis(REDIS_URL, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => Math.min(times * RETRY_STEP_MS, RETRY_MAX_MS)
  });

  client.on("ready", () => {
    ready = true;
    logger.info("redis.ready");
  });
  client.on("end", () => {
    ready = false;
  });
  client.on("error", (error) => {
    if (ready) {
      logger.warn("redis.error", serializeError(error));
    }
    ready = false;
  });

  client.connect().catch((error) => {
    logger.warn("redis.connect_failed", serializeError(error));
  });
} else {
  logger.info("redis.disabled", { reason: "REDIS_URL not set" });
}

export function getRedis() {
  return client;
}

export function isRedisReady() {
  return Boolean(client) && ready && client.status === "ready";
}

export async function closeRedis() {
  if (!client) {
    return;
  }
  try {
    await client.quit();
  } catch {
    client.disconnect();
  }
}

export default client;
