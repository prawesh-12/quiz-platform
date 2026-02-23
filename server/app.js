import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import errorHandler from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.routes.js";
import questionsRouter from "./routes/questions.routes.js";
import quizzesRouter from "./routes/quizzes.routes.js";
import sessionsRouter from "./routes/sessions.routes.js";
import subjectsRouter from "./routes/subjects.routes.js";
import unitsRouter from "./routes/units.routes.js";
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

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/units", unitsRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/quizzes", quizzesRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/violations", violationsRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Quiz Platform API is running" });
});

// app.use((req, res) => {
//   res.status(404).json({ error: "Route not found" });
// });

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

app.use(errorHandler);

export default app;
