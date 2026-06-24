import { getRedis, isRedisReady } from "../config/redis.js";
import logger, { serializeError } from "../utils/logger.js";
import { measure } from "../utils/requestTiming.js";

function revokedKey(tokenHash) {
  return `revoked:${tokenHash}`;
}

// Auth writes revoked:<hash> on logout with TTL = token life. Redis down: treat as not
// revoked so an outage can't lock everyone out — tokens still expire on their own.
export async function isTokenRevoked(tokenHash) {
  const redis = getRedis();
  if (!redis || !isRedisReady()) {
    return false;
  }

  try {
    return (await measure("redis", () => redis.exists(revokedKey(tokenHash)))) === 1;
  } catch (error) {
    logger.warn("revoked.check_failed", serializeError(error));
    return false;
  }
}
