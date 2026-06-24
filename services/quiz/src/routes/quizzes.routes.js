import { Router } from "express";

import {
  autoGenerateQuiz,
  createManualQuiz,
  deleteQuiz,
  duplicateQuiz,
  getQuizById,
  getQuizPreview,
  listQuizzes,
  updateQuiz,
  updateQuizStatus,
} from "../controllers/quizzes.controller.js";
import {
  autoGenerateQuizSchema,
  createManualQuizSchema,
  updateQuizSchema,
  updateQuizStatusSchema,
} from "../validators/quizzes.validator.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";

const quizzesRouter = Router();

quizzesRouter.use(authenticate, authorize("teacher", "admin"));
quizzesRouter.get("/", listQuizzes);
quizzesRouter.get("/:id/preview", getQuizPreview);
quizzesRouter.get("/:id", getQuizById);
quizzesRouter.post("/manual", validate(createManualQuizSchema), createManualQuiz);
quizzesRouter.post("/auto-generate", validate(autoGenerateQuizSchema), autoGenerateQuiz);
quizzesRouter.post("/:id/duplicate", duplicateQuiz);
quizzesRouter.put("/:id/status", validate(updateQuizStatusSchema), updateQuizStatus);
quizzesRouter.put("/:id", validate(updateQuizSchema), updateQuiz);
quizzesRouter.delete("/:id", deleteQuiz);

export default quizzesRouter;
