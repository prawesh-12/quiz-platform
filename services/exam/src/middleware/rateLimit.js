import { getRedis, isRedisReady } from "../config/redis.js";
import logger, { serializeError } from "../utils/logger.js";

// Load-test escape hatch: a single host shares one IP, so per-IP limits would throttle
// the test. NEVER enable in production.
const RATE_LIMIT_DISABLED =
  String(process.env.RATE_LIMIT_DISABLED || "").toLowerCase() === "true";

const MILLIS_PER_SECOND = 1000;

// In-memory fallback buckets (per process) used when Redis is unavailable.
const buckets = new Map();

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function pruneBucket(bucket, now, windowMs) {
  while (bucket.length && now - bucket[0] > windowMs) {
    bucket.shift();
  }
}

function inMemoryLimit({ key, max, windowMs, message, res, next }) {
  const now = Date.now();
  const bucket = buckets.get(key) || [];
  pruneBucket(bucket, now, windowMs);

  if (bucket.length >= max) {
    const retryAfterMs = Math.max(0, windowMs - (now - bucket[0]));
    res.set("Retry-After", String(Math.ceil(retryAfterMs / MILLIS_PER_SECOND)));
    return res.status(429).json({ error: message });
  }

  bucket.push(now);
  buckets.set(key, bucket);
  return next();
}

// Fixed-window limiter. Counters in Redis (shared across instances) when available,
// else the in-memory bucket.
export default function rateLimit({
  keyGenerator,
  max,
  windowMs,
  message = "Too many requests. Please slow down."
}) {
  return async (req, res, next) => {
    if (RATE_LIMIT_DISABLED) {
      return next();
    }

    const baseKey = keyGenerator(req, { ip: getClientIp(req) });
    const redis = getRedis();

    if (redis && isRedisReady()) {
      const key = `rate_limit:${baseKey}`;
      try {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.pexpire(key, windowMs);
        }
        if (count > max) {
          const ttl = await redis.pttl(key);
          res.set("Retry-After", String(Math.ceil(Math.max(0, ttl) / MILLIS_PER_SECOND)));
          return res.status(429).json({ error: message });
        }
        return next();
      } catch (error) {
        logger.warn("ratelimit.redis_failed", { key: baseKey, ...serializeError(error) });
        // fall through to in-memory
      }
    }

    return inMemoryLimit({ key: baseKey, max, windowMs, message, res, next });
  };
}
