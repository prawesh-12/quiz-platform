export default function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const PG_ERROR_MAP = {
    "28P01": {
      statusCode: 503,
      message: "Database authentication failed. Check server database credentials."
    },
    "3D000": {
      statusCode: 503,
      message: "Database does not exist. Create the configured database and rerun schema setup."
    },
    "42P01": {
      statusCode: 503,
      message: "Database schema is missing. Run server/sql/schema.sql against the configured database."
    },
    "ECONNREFUSED": {
      statusCode: 503,
      message: "Database is unavailable. Ensure PostgreSQL is running and reachable."
    }
  };

  const mapped = PG_ERROR_MAP[err.code];
  const statusCode = mapped?.statusCode || err.statusCode || 500;
  const message = mapped?.message || err.message || "Internal server error";

  // Only server-side faults are noise-worthy; expected 4xx (validation, not-found) are not.
  if (statusCode >= 500) {
    console.error(err);
  }

  const body = { error: message };
  if (err.details && typeof err.details === "object") {
    Object.assign(body, err.details);
  }

  return res.status(statusCode).json(body);
}
