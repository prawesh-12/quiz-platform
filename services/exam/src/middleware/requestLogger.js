import { randomUUID } from "crypto";

import logger from "../utils/logger.js";

const MS_ROUNDING = 10;

// Attach a request id (req.id + X-Request-Id header) and log one line per request.
export default function requestLogger(req, res, next) {
  const requestId = req.headers["x-request-id"] || randomUUID();
  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);

  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const level = res.statusCode >= 500 ? "error" : "info";

    logger[level]("request", {
      requestId,
      method: req.method,
      route: req.route?.path || req.originalUrl?.split("?")[0],
      status: res.statusCode,
      durationMs: Math.round(durationMs * MS_ROUNDING) / MS_ROUNDING
    });
  });

  next();
}
