import { Router } from "express";

import { createUnit, listUnitsBySubject } from "../controllers/units.controller.js";
import { createSubject, createSubjectSchema, deleteSubject, getQuizHistoryBySubject, listSubjects } from "../controllers/subjects.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";

const subjectsRouter = Router();

subjectsRouter.use(authenticate, authorize("teacher"));
subjectsRouter.get("/", listSubjects);
subjectsRouter.post("/", validate(createSubjectSchema), createSubject);
subjectsRouter.delete("/:id", deleteSubject);

// Unit routes under subjects
subjectsRouter.get("/:id/units", listUnitsBySubject);
subjectsRouter.post("/:id/units", createUnit);

// Quiz history
subjectsRouter.get("/:id/quiz-history", getQuizHistoryBySubject);

export default subjectsRouter;
