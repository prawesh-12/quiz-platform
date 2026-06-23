import { getRedis, isRedisReady } from "../config/redis.js";
import logger, { serializeError } from "../utils/logger.js";
import createTtlCache from "../utils/ttlCache.js";

// Two-tier cache for short-lived JSON reads: Redis (shared) when available, else a
// process-local TTL cache so a Redis outage degrades instead of hammering PostgreSQL.

const LOCAL_MAX_ENTRIES = 2000;
const local = createTtlCache({ maxEntries: LOCAL_MAX_ENTRIES });

// Resolve factory() for ttlMs, preferring Redis; fall through to local on any Redis error.
export async function getCachedJson(key, ttlMs, factory) {
  const redis = getRedis();

  if (redis && isRedisReady()) {
    try {
      const cached = await redis.get(key);
      if (cached != null) {
        return JSON.parse(cached);
      }

      const value = await factory();
      await redis.set(key, JSON.stringify(value), "PX", ttlMs);
      return value;
    } catch (error) {
      logger.warn("cache.redis_read_failed", { key, ...serializeError(error) });
    }
  }

  return local.getOrSet(key, ttlMs, factory);
}

export async function invalidateCache(key) {
  local.invalidate(key);

  const redis = getRedis();
  if (redis && isRedisReady()) {
    try {
      await redis.del(key);
    } catch (error) {
      logger.warn("cache.redis_del_failed", { key, ...serializeError(error) });
    }
  }
}
