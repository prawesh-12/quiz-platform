import compression from "compression";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { query } from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";
import requestLogger from "./middleware/requestLogger.js";
import adminRouter from "./routes/admin.routes.js";
import quizzesRouter from "./routes/quizzes.routes.js";
import sessionsRouter from "./routes/sessions.routes.js";
import teachersRouter from "./routes/teachers.routes.js";
import violationsRouter from "./routes/violations.routes.js";

const app = express();
const configuredOrigins = (
  process.env.CLIENT_URLS || process.env.CLIENT_URL || ""
)
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
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "256kb" }));

// Liveness: cheap, no dependencies — used by orchestrators to know the process is up.
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Readiness: verifies the process can actually serve traffic (DB reachable).
app.get("/api/ready", async (req, res) => {
  try {
    await query("SELECT 1");
    res.status(200).json({ status: "ready" });
  } catch (error) {
    res.status(503).json({ status: "unavailable" });
  }
});

app.use("/api/admin", adminRouter);
app.use("/api/teachers", teachersRouter);
app.use("/api/quizzes", quizzesRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/violations", violationsRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "QuizLoom API is running" });
});

// app.use((req, res) => {
//   res.status(404).json({ error: "Route not found" });
// });

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

app.use(errorHandler);

export default app;
