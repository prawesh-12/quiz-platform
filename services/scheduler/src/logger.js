// Minimal structured logger to keep this service dependency-light.
function write(level, event, meta = {}) {
  const line = JSON.stringify({ level, event, ts: new Date().toISOString(), ...meta });
  if (level === "error") {
    process.stderr.write(`${line}\n`);
    return;
  }
  process.stdout.write(`${line}\n`);
}

export function serializeError(error) {
  return { message: error?.message, stack: error?.stack };
}

export default {
  info: (event, meta) => write("info", event, meta),
  warn: (event, meta) => write("warn", event, meta),
  error: (event, meta) => write("error", event, meta),
};
