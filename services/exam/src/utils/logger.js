// Leveled JSON logger that redacts sensitive fields. Dependency-free (wraps console).

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

const configuredLevel = (process.env.LOG_LEVEL || "info").toLowerCase();
const minLevel = LEVELS[configuredLevel] ?? LEVELS.info;

const SERVICE_NAME = process.env.SERVICE_NAME || "exam";

const REDACT_KEYS = new Set([
  "authorization",
  "x-session-token",
  "sessiontoken",
  "session_token",
  "access_code",
  "accesscode",
  "access_token",
  "accesstoken",
  "password",
  "token",
  "jwt",
  "secret"
]);

function redact(value, seen = new Set()) {
  if (value == null || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (REDACT_KEYS.has(key.toLowerCase())) {
      out[key] = "[REDACTED]";
    } else {
      out[key] = redact(val, seen);
    }
  }
  return out;
}

function emit(level, message, meta) {
  if (LEVELS[level] < minLevel) {
    return;
  }

  const entry = {
    level,
    time: new Date().toISOString(),
    service: SERVICE_NAME,
    msg: message,
    ...(meta ? redact(meta) : {})
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function serializeError(error) {
  if (!(error instanceof Error)) {
    return { error };
  }
  return {
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    }
  };
}

const logger = {
  debug: (message, meta) => emit("debug", message, meta),
  info: (message, meta) => emit("info", message, meta),
  warn: (message, meta) => emit("warn", message, meta),
  error: (message, meta) => emit("error", message, meta)
};

export default logger;
