import { Router } from "express";

import {
  autoGenerateQuiz,
  autoGenerateQuizSchema,
  createManualQuiz,
  createManualQuizSchema,
  duplicateQuiz,
  exportQuizResponses,
  getQuizById,
  getQuizLeaderboard,
  getQuizLiveStats,
  getQuizPreview,
  listQuizzes,
  updateQuiz,
  updateQuizSchema,
  updateQuizStatus,
  updateQuizStatusSchema
} from "../controllers/quizzes.controller.js";
import { getQuizResponses } from "../controllers/responses.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";

const quizzesRouter = Router();

quizzesRouter.use(authenticate, authorize("teacher"));
quizzesRouter.get("/", listQuizzes);
quizzesRouter.get("/:id/live-stats", getQuizLiveStats);
quizzesRouter.get("/:id/preview", getQuizPreview);
quizzesRouter.get("/:id/export", exportQuizResponses);
quizzesRouter.get("/:id/leaderboard", getQuizLeaderboard);
quizzesRouter.get("/:id/responses", getQuizResponses);
quizzesRouter.get("/:id", getQuizById);
quizzesRouter.post("/manual", validate(createManualQuizSchema), createManualQuiz);
quizzesRouter.post("/auto-generate", validate(autoGenerateQuizSchema), autoGenerateQuiz);
quizzesRouter.post("/:id/duplicate", duplicateQuiz);
quizzesRouter.put("/:id/status", validate(updateQuizStatusSchema), updateQuizStatus);
quizzesRouter.put("/:id", validate(updateQuizSchema), updateQuiz);

export default quizzesRouter;
