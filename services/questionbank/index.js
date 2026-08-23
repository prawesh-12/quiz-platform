import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

const envMode = process.env.NODE_ENV === "production" ? "production" : "local";
dotenv.config({ path: `.env.${envMode}` });

import { buildCorsOptions } from "./src/config/cors.js";
import { validateRequiredEnv } from "./src/utils/env.js";

validateRequiredEnv();

const [
  { query, default: pool },
  { runMigrations },
  { registerGracefulShutdown, closeServer, SHUTDOWN_TIMEOUT_MS },
  { default: logger, serializeError },
  { closeRedis, isRedisReady },
  { startAuthEventsConsumer },
  { default: requestLogger },
  { default: errorHandler },
  { default: subjectsRouter },
  { default: unitsRouter },
  { default: questionsRouter },
  { default: adminRouter },
  { default: internalRouter }
] = await Promise.all([
  import("./src/config/db.js"),
  import("./src/config/migrations.js"),
  import("./src/utils/gracefulShutdown.js"),
  import("./src/utils/logger.js"),
  import("./src/config/redis.js"),
  import("./src/jobs/authEventsConsumer.js"),
  import("./src/middleware/requestLogger.js"),
  import("./src/middleware/errorHandler.js"),
  import("./src/routes/subjects.routes.js"),
  import("./src/routes/units.routes.js"),
  import("./src/routes/questions.routes.js"),
  import("./src/routes/admin.routes.js"),
  import("./src/routes/internal.routes.js")
]);

const PORT = Number(process.env.PORT || 5000);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30000);
const HEADERS_TIMEOUT_MS = Number(process.env.HEADERS_TIMEOUT_MS || 35000);
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "256kb";

const app = express();

// Behind the nginx gateway (one hop), so req.ip reflects the real client for rate limiting.
app.set("trust proxy", 1);

app.use(cors(buildCorsOptions()));

app.use(compression());
app.use(requestLogger);
app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/ready", async (_req, res) => {
  const checks = { db: false, redis: isRedisReady() };
  try {
    await query("SELECT 1");
    checks.db = true;
  } catch {
    // The failed probe is the signal: checks.db stays false and the route answers 503.
  }
  res.status(checks.db ? 200 : 503).json({ status: checks.db ? "ready" : "unavailable", checks });
});

app.use("/api/subjects", subjectsRouter);
app.use("/api/units", unitsRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/admin", adminRouter);
app.use("/internal", internalRouter);

app.use(errorHandler);

try {
  await runMigrations();
} catch (error) {
  logger.error("startup.db_init_failed", serializeError(error));
  process.exit(1);
}

const authEventsConsumer = startAuthEventsConsumer();

const { startOutboxRelay } = await import("./src/config/outbox.js");
const outboxRelay = startOutboxRelay();

const server = app.listen(PORT, () => {
  logger.info("server.listening", { port: PORT });
});

server.requestTimeout = REQUEST_TIMEOUT_MS;
server.headersTimeout = HEADERS_TIMEOUT_MS;

const KEEPWARM_ENABLED = process.env.KEEPWARM_ENABLED !== "false";
const KEEPWARM_INTERVAL_MS = Number(process.env.KEEPWARM_INTERVAL_MS || 240000);

// Ping this service's own Neon endpoint to keep it from cold-starting (free-tier scale-to-zero).
if (KEEPWARM_ENABLED) {
  setInterval(() => {
    query("SELECT 1").catch((error) => logger.warn("keepwarm.failed", serializeError(error)));
  }, KEEPWARM_INTERVAL_MS).unref();
}

registerGracefulShutdown(
  [
    { name: "http-server", run: closeServer(server) },
    { name: "auth-events-consumer", run: () => authEventsConsumer.stop() },
    { name: "outbox-relay", run: () => outboxRelay.stop() },
    { name: "redis", run: () => closeRedis() },
    { name: "pg-pool", run: () => pool.end() }
  ],
  { timeoutMs: SHUTDOWN_TIMEOUT_MS }
);
