import cors from "cors";
import express from "express";

import errorHandler from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.routes.js";
import questionsRouter from "./routes/questions.routes.js";
import quizzesRouter from "./routes/quizzes.routes.js";
import sessionsRouter from "./routes/sessions.routes.js";
import subjectsRouter from "./routes/subjects.routes.js";
import unitsRouter from "./routes/units.routes.js";
import violationsRouter from "./routes/violations.routes.js";

const app = express();

app.use(
  cors({
    origin: "https://quiz-platform-frontend-miv2.onrender.com",
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

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
