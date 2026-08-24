import logger, { serializeError } from "../utils/logger.js";

const SERVER_ERROR_STATUS = 500;
const SERVICE_UNAVAILABLE = 503;

const PG_ERROR_MAP = {
  "28P01": {
    statusCode: SERVICE_UNAVAILABLE,
    message: "Database authentication failed. Check server database credentials."
  },
  "3D000": {
    statusCode: SERVICE_UNAVAILABLE,
    message: "Database does not exist. Create the configured database and rerun schema setup."
  },
  "42P01": {
    statusCode: SERVICE_UNAVAILABLE,
    message: "Database schema is missing. Run `npm run db:migrate` against the configured database."
  },
  "ECONNREFUSED": {
    statusCode: SERVICE_UNAVAILABLE,
    message: "Database is unavailable. Ensure PostgreSQL is running and reachable."
  }
};

const DB_WAKING = {
  statusCode: SERVICE_UNAVAILABLE,
  message: "Database is waking up. Try again in a few seconds."
};

// pg reports a cold-start connect failure with no error code, only this text.
function isConnectTimeout(error) {
  const message = String(error?.message || "");
  return (
    message.includes("timeout exceeded when trying to connect") ||
    message.includes("Connection terminated due to connection timeout")
  );
}

export default function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const mapped = PG_ERROR_MAP[err.code] || (isConnectTimeout(err) ? DB_WAKING : null);
  const statusCode = mapped?.statusCode || err.statusCode || SERVER_ERROR_STATUS;
  const message = mapped?.message || err.message || "Internal server error";

  // Only server-side faults are noise-worthy; expected 4xx (validation, not-found) are not.
  if (statusCode >= SERVER_ERROR_STATUS) {
    const durationMs = req.startedAt
      ? Math.round((Number(process.hrtime.bigint() - req.startedAt) / 1e6) * 10) / 10
      : undefined;
    logger.error("unhandled.error", {
      requestId: req.id,
      endpoint: req.route?.path || req.originalUrl?.split("?")[0],
      userId: req.user?.id,
      durationMs,
      ...serializeError(err)
    });
  }

  const body = { error: message };
  if (err.details && typeof err.details === "object") {
    Object.assign(body, err.details);
  }

  return res.status(statusCode).json(body);
}
