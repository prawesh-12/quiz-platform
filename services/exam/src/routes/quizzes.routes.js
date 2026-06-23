import { Router } from "express";

import {
  exportQuizResponses,
  getQuizLeaderboard,
  getQuizLiveStats
} from "../controllers/quizzes.controller.js";
import { getQuizResponses } from "../controllers/responses.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const quizzesRouter = Router();

quizzesRouter.use(authenticate, authorize("teacher", "admin"));
quizzesRouter.get("/:id/live-stats", getQuizLiveStats);
quizzesRouter.get("/:id/leaderboard", getQuizLeaderboard);
quizzesRouter.get("/:id/export", exportQuizResponses);
quizzesRouter.get("/:id/responses", getQuizResponses);

export default quizzesRouter;
