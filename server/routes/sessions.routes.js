import { Router } from "express";

import {
  enterSession,
  enterSessionSchema,
  progressSessionSchema,
  saveSessionProgress,
  submitSession,
  submitSessionSchema
} from "../controllers/sessions.controller.js";
import validate from "../middleware/validate.js";

const sessionsRouter = Router();

sessionsRouter.post("/enter", validate(enterSessionSchema), enterSession);
sessionsRouter.post("/progress", validate(progressSessionSchema), saveSessionProgress);
sessionsRouter.post("/submit", validate(submitSessionSchema), submitSession);

export default sessionsRouter;
