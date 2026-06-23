import dotenv from "dotenv";

dotenv.config();

const [
  { default: app },
  { JWT_SECRET },
  { default: pool },
  { runMigrations },
  { startQuizScheduler },
  { initObservability },
  { registerGracefulShutdown, closeServer },
  { default: logger },
  { serializeError },
  { closeRedis }
] = await Promise.all([
  import("./app.js"),
  import("./config/jwt.js"),
  import("./config/db.js"),
  import("./config/migrations.js"),
  import("./services/quizScheduler.service.js"),
  import("./config/observability.js"),
  import("./utils/gracefulShutdown.js"),
  import("./utils/logger.js"),
  import("./utils/logger.js"),
  import("./config/redis.js")
]);

const PORT = Number(process.env.PORT || 5000);
// API instances should set SCHEDULER_ENABLED=false and let the worker own transitions.
const SCHEDULER_ENABLED = (process.env.SCHEDULER_ENABLED ?? "true").toLowerCase() !== "false";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

initObservability();

try {
  await runMigrations();
} catch (error) {
  logger.error("startup.db_init_failed", serializeError(error));
  process.exit(1);
}

let scheduler = null;
if (SCHEDULER_ENABLED) {
  scheduler = await startQuizScheduler();
  logger.info("scheduler.started", { owner: "api" });
} else {
  logger.info("scheduler.disabled", { reason: "SCHEDULER_ENABLED=false" });
}

const server = app.listen(PORT, () => {
  logger.info("server.listening", { port: PORT });
});

// Bound slow clients/queries so connections are not held indefinitely.
server.requestTimeout = Number(process.env.REQUEST_TIMEOUT_MS || 30000);
server.headersTimeout = Number(process.env.HEADERS_TIMEOUT_MS || 35000);

registerGracefulShutdown([
  { name: "scheduler", run: async () => scheduler?.stop?.() },
  { name: "http-server", run: closeServer(server) },
  { name: "redis", run: () => closeRedis() },
  { name: "pg-pool", run: () => pool.end() }
]);
