import { randomUUID } from "crypto";

import logger from "../utils/logger.js";
import { enterContext } from "../utils/requestTiming.js";

const PRECISION_FACTOR = 10;
const SERVER_ERROR_STATUS = 500;

function round(ms) {
  return Math.round(ms * PRECISION_FACTOR) / PRECISION_FACTOR;
}

// Attach a request id (req.id + X-Request-Id), accumulate per-op timings, log one line per request.
export default function requestLogger(req, res, next) {
  const requestId = req.headers["x-request-id"] || randomUUID();
  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);

  const startedAt = process.hrtime.bigint();
  req.startedAt = startedAt;
  const ctx = { requestId, dbMs: 0, redisMs: 0, externalMs: 0 };

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const level = res.statusCode >= SERVER_ERROR_STATUS ? "error" : "info";

    logger[level]("request", {
      requestId,
      method: req.method,
      route: req.route?.path || req.originalUrl?.split("?")[0],
      status: res.statusCode,
      userId: req.user?.id,
      dbMs: round(ctx.dbMs),
      redisMs: round(ctx.redisMs),
      externalMs: round(ctx.externalMs),
      durationMs: round(durationMs)
    });
  });

  enterContext(ctx);
  next();
}
