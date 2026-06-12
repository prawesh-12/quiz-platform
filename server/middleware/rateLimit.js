const buckets = new Map();

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function pruneBucket(bucket, now, windowMs) {
  while (bucket.length && now - bucket[0] > windowMs) {
    bucket.shift();
  }
}

export default function rateLimit({
  keyGenerator,
  max,
  windowMs,
  message = "Too many requests. Please slow down."
}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = keyGenerator(req, { ip: getClientIp(req) });
    const bucket = buckets.get(key) || [];

    pruneBucket(bucket, now, windowMs);

    if (bucket.length >= max) {
      const retryAfterMs = Math.max(0, windowMs - (now - bucket[0]));
      res.set("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
      return res.status(429).json({ error: message });
    }

    bucket.push(now);
    buckets.set(key, bucket);

    return next();
  };
}
