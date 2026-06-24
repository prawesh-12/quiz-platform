import { Router } from "express";

import { selectQuestions } from "../controllers/internal.controller.js";
import { selectQuestionsSchema } from "../validators/internal.validator.js";
import internalKey from "../middleware/internalKey.js";
import validate from "../middleware/validate.js";

const internalRouter = Router();

internalRouter.use(internalKey);
internalRouter.post("/questions/select", validate(selectQuestionsSchema), selectQuestions);

export default internalRouter;
