import logger, { serializeError } from "./logger.js";

// On SIGTERM/SIGINT, run async close steps ({ name, run }) in order then exit. A hard
// timeout guarantees exit even if a step hangs.
export function registerGracefulShutdown(steps, { timeoutMs = 15000 } = {}) {
  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info("shutdown.started", { signal });

    const forceTimer = setTimeout(() => {
      logger.error("shutdown.forced", { signal, timeoutMs });
      process.exit(1);
    }, timeoutMs);
    forceTimer.unref?.();

    for (const step of steps) {
      try {
        await step.run();
        logger.info("shutdown.step_done", { step: step.name });
      } catch (error) {
        logger.error("shutdown.step_failed", { step: step.name, ...serializeError(error) });
      }
    }

    clearTimeout(forceTimer);
    logger.info("shutdown.complete", { signal });
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Promisified server.close so it composes as a shutdown step.
export function closeServer(server) {
  return () =>
    new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
}
