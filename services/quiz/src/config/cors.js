// The allowlist is env-only: a missing CLIENT_URLS must fail at startup, never silently widen.
export function buildCorsOptions() {
  const allowedOrigins = process.env.CLIENT_URLS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  };
}
