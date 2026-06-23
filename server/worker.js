import dotenv from "dotenv";

dotenv.config();

const [
  { default: pool },
  { runMigrations },
  { startQuizScheduler },
  { initObservability },
  { registerGracefulShutdown },
  { default: logger },
  { serializeError },
  { prewarmScheduledQuizzes },
  { closeRedis },
  { readPositiveIntegerEnv }
] = await Promise.all([
  import("./config/db.js"),
  import("./config/migrations.js"),
  import("./services/quizScheduler.service.js"),
  import("./config/observability.js"),
  import("./utils/gracefulShutdown.js"),
  import("./utils/logger.js"),
  import("./utils/logger.js"),
  import("./services/quizSnapshot.service.js"),
  import("./config/redis.js"),
  import("./utils/env.js")
]);

// The worker owns scheduled transitions, batch auto-submit, and snapshot prewarming
// so the API stays request-only.
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

initObservability();

// Run migrations in case the worker boots first; advisory-locked so it no-ops if an
// API already ran them. Skip with WORKER_RUN_MIGRATIONS=false.
if ((process.env.WORKER_RUN_MIGRATIONS ?? "true").toLowerCase() !== "false") {
  try {
    await runMigrations();
  } catch (error) {
    logger.error("worker.db_init_failed", serializeError(error));
    process.exit(1);
  }
}

const scheduler = await startQuizScheduler();

// Prewarm Redis snapshots for quizzes about to start. No-op without Redis; non-overlapping.
const PREWARM_INTERVAL_MS = readPositiveIntegerEnv("QUIZ_PREWARM_INTERVAL_MS", 30000);
let prewarmInFlight = false;
const prewarmTimer = setInterval(async () => {
  if (prewarmInFlight) {
    return;
  }
  prewarmInFlight = true;
  try {
    await prewarmScheduledQuizzes();
  } catch (error) {
    logger.warn("worker.prewarm_tick_failed", serializeError(error));
  } finally {
    prewarmInFlight = false;
  }
}, PREWARM_INTERVAL_MS);
prewarmTimer.unref?.();

logger.info("worker.started", { owner: "worker" });

registerGracefulShutdown([
  { name: "scheduler", run: async () => scheduler?.stop?.() },
  { name: "prewarm", run: async () => clearInterval(prewarmTimer) },
  { name: "redis", run: () => closeRedis() },
  { name: "pg-pool", run: () => pool.end() }
]);
