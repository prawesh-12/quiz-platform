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

export default function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const mapped = PG_ERROR_MAP[err.code];
  const statusCode = mapped?.statusCode || err.statusCode || SERVER_ERROR_STATUS;
  const message = mapped?.message || err.message || "Internal server error";

  // Only server-side faults are noise-worthy; expected 4xx (validation, not-found) are not.
  if (statusCode >= SERVER_ERROR_STATUS) {
    logger.error("unhandled.error", {
      requestId: req.id,
      route: req.originalUrl?.split("?")[0],
      ...serializeError(err)
    });
  }

  const body = { error: message };
  if (err.details && typeof err.details === "object") {
    Object.assign(body, err.details);
  }

  return res.status(statusCode).json(body);
}
