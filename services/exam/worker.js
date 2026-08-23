import dotenv from "dotenv";

const envMode = process.env.NODE_ENV === "production" ? "production" : "local";
dotenv.config({ path: `.env.${envMode}` });

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

// Owns auto-submit on quiz end, snapshot writes and cleanup on delete; it never flips a status itself.
initObservability();

// Advisory-locked, so this no-ops when the API already migrated; the worker can boot first.
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

// The worker enqueues auto-submit events, so it drains the outbox too; SKIP LOCKED keeps that safe.
const { startOutboxRelay } = await import("./src/config/outbox.js");
const outboxRelay = startOutboxRelay();

logger.info("worker.started", { owner: "worker" });

registerGracefulShutdown(
  [
    { name: "quiz-events-consumer", run: async () => quizEventsConsumer?.stop?.() },
    { name: "questionbank-projection-consumer", run: async () => questionBankProjectionConsumer?.stop?.() },
    { name: "outbox-relay", run: () => outboxRelay.stop() },
    { name: "redis", run: () => closeRedis() },
    { name: "pg-pool", run: () => pool.end() }
  ],
  { timeoutMs: SHUTDOWN_TIMEOUT_MS }
);
