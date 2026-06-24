import { Router } from "express";

import { getQuizHistoryBySubject } from "../controllers/subjects.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const subjectsRouter = Router();

subjectsRouter.use(authenticate, authorize("teacher", "admin"));
subjectsRouter.get("/:id/quiz-history", getQuizHistoryBySubject);

export default subjectsRouter;
