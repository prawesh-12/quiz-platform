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

const MINUTE_MS = 60 * 1000;
const SECOND_MS = 1000;
const ENTRY_WINDOW_MS = 5 * MINUTE_MS;
const ENTRY_MAX = 30;
const PROGRESS_WINDOW_MS = 10 * SECOND_MS;
const PROGRESS_MAX = 12;
const SUBMIT_WINDOW_MS = MINUTE_MS;
const SUBMIT_MAX = 6;
const TOKEN_KEY_MAX_LEN = 64;

const sessionsRouter = Router();

const entryRateLimit = rateLimit({
  windowMs: ENTRY_WINDOW_MS,
  max: ENTRY_MAX,
  keyGenerator: (req, { ip }) =>
    `session-entry:${ip}:${String(req.body?.access_token || "missing").slice(0, TOKEN_KEY_MAX_LEN)}`,
  message: "Too many quiz entry attempts. Please wait and try again."
});

const progressRateLimit = rateLimit({
  windowMs: PROGRESS_WINDOW_MS,
  max: PROGRESS_MAX,
  keyGenerator: (req, { ip }) => `session-progress:${req.headers["x-session-token"] || ip}`,
  message: "Too many answer save requests. Please slow down."
});

const submitRateLimit = rateLimit({
  windowMs: SUBMIT_WINDOW_MS,
  max: SUBMIT_MAX,
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
