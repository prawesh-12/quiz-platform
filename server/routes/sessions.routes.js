import { Router } from "express";

import {
  enterSession,
  getSessionResult,
  getSessionTiming,
  saveSessionAnswer,
  saveSessionProgress,
  submitSession
} from "../controllers/sessions.controller.js";
import {
  answerProgressSchema,
  enterSessionSchema,
  progressSessionSchema,
  submitSessionSchema
} from "../validators/sessions.validator.js";
import rateLimit from "../middleware/rateLimit.js";
import validate from "../middleware/validate.js";

const sessionsRouter = Router();

const entryRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  keyGenerator: (req, { ip }) => `session-entry:${ip}:${String(req.body?.access_token || "missing").slice(0, 64)}`,
  message: "Too many quiz entry attempts. Please wait and try again."
});

const progressRateLimit = rateLimit({
  windowMs: 10 * 1000,
  max: 12,
  keyGenerator: (req, { ip }) => `session-progress:${req.headers["x-session-token"] || ip}`,
  message: "Too many answer save requests. Please slow down."
});

const submitRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  keyGenerator: (req, { ip }) => `session-submit:${req.headers["x-session-token"] || ip}`,
  message: "Too many submit attempts. Please wait and try again."
});

sessionsRouter.post("/enter", entryRateLimit, validate(enterSessionSchema), enterSession);
sessionsRouter.get("/timing", getSessionTiming);
sessionsRouter.get("/result", getSessionResult);
sessionsRouter.patch("/answers/:questionId", progressRateLimit, validate(answerProgressSchema), saveSessionAnswer);
sessionsRouter.patch("/progress", progressRateLimit, validate(progressSessionSchema), saveSessionProgress);
sessionsRouter.post("/progress", progressRateLimit, validate(progressSessionSchema), saveSessionProgress);
sessionsRouter.post("/submit", submitRateLimit, validate(submitSessionSchema), submitSession);

export default sessionsRouter;
