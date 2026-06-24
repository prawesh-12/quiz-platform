import logger from "../utils/logger.js";

// Error-monitor seam (Sentry/Datadog). No-op unless SENTRY_DSN is set. To wire Sentry,
// install @sentry/node and fill in captureException.

const dsn = process.env.SENTRY_DSN;
let enabled = false;

export function initObservability() {
  if (!dsn) {
    return;
  }
  enabled = true;
  logger.info("observability.enabled", { provider: "sentry" });
}

export function captureException(error, context = {}) {
  if (!enabled) {
    return;
  }
  logger.error("captured.exception", { context });
}

export function isObservabilityEnabled() {
  return enabled;
}
