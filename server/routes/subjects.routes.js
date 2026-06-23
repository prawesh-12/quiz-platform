import { Router } from "express";

import { getQuizHistoryBySubject } from "../controllers/subjects.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const subjectsRouter = Router();

subjectsRouter.use(authenticate);
subjectsRouter.get("/:id/quiz-history", authorize("teacher"), getQuizHistoryBySubject);

export default subjectsRouter;
