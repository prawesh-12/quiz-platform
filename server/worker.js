import dotenv from "dotenv";

dotenv.config();

const [
  { default: pool },
  { runMigrations },
  { startSchedulerConsumer },
  { startAuthProjectionConsumer },
  { startQuestionBankProjectionConsumer },
  { initObservability },
  { registerGracefulShutdown },
  { default: logger },
  { serializeError },
  { closeRedis }
] = await Promise.all([
  import("./config/db.js"),
  import("./config/migrations.js"),
  import("./services/schedulerConsumer.service.js"),
  import("./services/authProjection.consumer.js"),
  import("./services/questionbankProjection.consumer.js"),
  import("./config/observability.js"),
  import("./utils/gracefulShutdown.js"),
  import("./utils/logger.js"),
  import("./utils/logger.js"),
  import("./config/redis.js")
]);

// The worker reacts to the scheduler service's due signals: it owns the status flips,
// batch auto-submit and snapshot builds so the API stays request-only.
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

const schedulerConsumer = startSchedulerConsumer();
const authProjectionConsumer = startAuthProjectionConsumer();
const questionBankProjectionConsumer = startQuestionBankProjectionConsumer();

logger.info("worker.started", { owner: "worker" });

registerGracefulShutdown([
  { name: "scheduler-consumer", run: async () => schedulerConsumer?.stop?.() },
  { name: "auth-projection-consumer", run: async () => authProjectionConsumer?.stop?.() },
  { name: "questionbank-projection-consumer", run: async () => questionBankProjectionConsumer?.stop?.() },
  { name: "redis", run: () => closeRedis() },
  { name: "pg-pool", run: () => pool.end() }
]);
