import Redis from "ioredis";

import logger, { serializeError } from "./logger.js";

// Required — detection has nowhere to publish until Redis is reachable.
const REDIS_URL = process.env.REDIS_URL || "";

let client = null;
let ready = false;

if (REDIS_URL) {
  client = new Redis(REDIS_URL, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => Math.min(times * 200, 5000),
  });

  client.on("ready", () => {
    ready = true;
    logger.info("scheduler.redis_ready");
  });
  client.on("end", () => {
    ready = false;
  });
  client.on("error", (error) => {
    if (ready) {
      logger.warn("scheduler.redis_error", serializeError(error));
    }
    ready = false;
  });

  client.connect().catch((error) => {
    logger.warn("scheduler.redis_connect_failed", serializeError(error));
  });
} else {
  logger.error("scheduler.redis_missing", { reason: "REDIS_URL not set" });
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
