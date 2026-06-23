import dotenv from "dotenv";

dotenv.config();

import { validateRequiredEnv } from "./src/utils/env.js";

validateRequiredEnv();

const [
  { default: pool },
  { runMigrations },
  { startQuizEventsConsumer },
  { startQuestionBankProjectionConsumer },
  { initObservability },
  { registerGracefulShutdown, SHUTDOWN_TIMEOUT_MS },
  { default: logger, serializeError },
  { closeRedis }
] = await Promise.all([
  import("./src/config/db.js"),
  import("./src/config/migrations.js"),
  import("./src/services/quizEvents.consumer.js"),
  import("./src/services/questionbankProjection.consumer.js"),
  import("./src/config/observability.js"),
  import("./src/utils/gracefulShutdown.js"),
  import("./src/utils/logger.js"),
  import("./src/config/redis.js")
]);

// Reacts to quiz/questionbank events: keeps read-models in step, flips no status itself —
// it owns auto-submit on quiz end, snapshot writes, and cleanup on delete.
initObservability();

// Run migrations in case the worker boots first; advisory-locked so it no-ops if the API
// already ran them. Skip with WORKER_RUN_MIGRATIONS=false.
if ((process.env.WORKER_RUN_MIGRATIONS ?? "true").toLowerCase() !== "false") {
  try {
    await runMigrations();
  } catch (error) {
    logger.error("worker.db_init_failed", serializeError(error));
    process.exit(1);
  }
}

const quizEventsConsumer = startQuizEventsConsumer();
const questionBankProjectionConsumer = startQuestionBankProjectionConsumer();

logger.info("worker.started", { owner: "worker" });

registerGracefulShutdown(
  [
    { name: "quiz-events-consumer", run: async () => quizEventsConsumer?.stop?.() },
    { name: "questionbank-projection-consumer", run: async () => questionBankProjectionConsumer?.stop?.() },
    { name: "redis", run: () => closeRedis() },
    { name: "pg-pool", run: () => pool.end() }
  ],
  { timeoutMs: SHUTDOWN_TIMEOUT_MS }
);
