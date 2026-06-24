import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

import { validateRequiredEnv } from "./src/utils/env.js";

validateRequiredEnv();

const [
  { query, default: pool },
  { runMigrations },
  { initObservability },
  { registerGracefulShutdown, closeServer, SHUTDOWN_TIMEOUT_MS },
  { default: logger, serializeError },
  { closeRedis, isRedisReady },
  { default: requestLogger },
  { default: errorHandler },
  { default: quizzesRouter },
  { default: sessionsRouter },
  { default: violationsRouter }
] = await Promise.all([
  import("./src/config/db.js"),
  import("./src/config/migrations.js"),
  import("./src/config/observability.js"),
  import("./src/utils/gracefulShutdown.js"),
  import("./src/utils/logger.js"),
  import("./src/config/redis.js"),
  import("./src/middleware/requestLogger.js"),
  import("./src/middleware/errorHandler.js"),
  import("./src/routes/quizzes.routes.js"),
  import("./src/routes/sessions.routes.js"),
  import("./src/routes/violations.routes.js")
]);

const DEFAULT_PORT = 5000;
const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
const DEFAULT_HEADERS_TIMEOUT_MS = 35000;
const OK_STATUS = 200;
const UNAVAILABLE_STATUS = 503;

const PORT = Number(process.env.PORT || DEFAULT_PORT);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || DEFAULT_REQUEST_TIMEOUT_MS);
const HEADERS_TIMEOUT_MS = Number(process.env.HEADERS_TIMEOUT_MS || DEFAULT_HEADERS_TIMEOUT_MS);
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "256kb";

const app = express();

const configuredOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins =
  configuredOrigins.length > 0
    ? configuredOrigins
    : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

app.use(compression());
app.use(requestLogger);
app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.get("/api/health", (_req, res) => {
  res.status(OK_STATUS).json({ status: "ok" });
});

app.get("/api/ready", async (_req, res) => {
  const checks = { db: false, redis: isRedisReady() };
  try {
    await query("SELECT 1");
    checks.db = true;
  } catch {
    // db unreachable
  }
  res.status(checks.db ? OK_STATUS : UNAVAILABLE_STATUS).json({
    status: checks.db ? "ready" : "unavailable",
    checks
  });
});

app.use("/api/quizzes", quizzesRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/violations", violationsRouter);

app.use(errorHandler);

initObservability();

try {
  await runMigrations();
} catch (error) {
  logger.error("startup.db_init_failed", serializeError(error));
  process.exit(1);
}

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
    { name: "redis", run: () => closeRedis() },
    { name: "pg-pool", run: () => pool.end() }
  ],
  { timeoutMs: SHUTDOWN_TIMEOUT_MS }
);
