import { Router } from "express";

import {
  bulkImportQuestions,
  createQuestion,
  deleteQuestion,
  listQuestions,
  updateQuestion
} from "../controllers/questions.controller.js";
import {
  bulkImportQuestionsSchema,
  createQuestionSchema,
  updateQuestionSchema
} from "../validators/questions.validator.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";

const questionsRouter = Router();

questionsRouter.use(authenticate, authorize("teacher", "admin"));
questionsRouter.get("/", listQuestions);
questionsRouter.post("/", validate(createQuestionSchema), createQuestion);
questionsRouter.post("/bulk-import", validate(bulkImportQuestionsSchema), bulkImportQuestions);
questionsRouter.put("/:id", validate(updateQuestionSchema), updateQuestion);
questionsRouter.delete("/:id", deleteQuestion);

export default questionsRouter;
