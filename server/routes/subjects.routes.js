import { Router } from "express";

import { createUnit, deleteUnit, listUnitsBySubject, updateUnit } from "../controllers/units.controller.js";
import { createSubject, createSubjectSchema, deleteSubject, getQuizHistoryBySubject, listSubjects } from "../controllers/subjects.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";

const subjectsRouter = Router();

subjectsRouter.use(authenticate);
subjectsRouter.get("/", authorize("teacher", "admin"), listSubjects);
subjectsRouter.post("/", authorize("admin"), validate(createSubjectSchema), createSubject);
subjectsRouter.delete("/:id", authorize("admin"), deleteSubject);

// Unit routes under subjects
subjectsRouter.get("/:id/units", authorize("teacher", "admin"), listUnitsBySubject);
subjectsRouter.post("/:id/units", authorize("admin"), createUnit);
subjectsRouter.put("/:id/units/:unitId", authorize("admin"), (req, _res, next) => {
  req.params.id = req.params.unitId;
  next();
}, updateUnit);
subjectsRouter.delete("/:id/units/:unitId", authorize("admin"), (req, _res, next) => {
  req.params.id = req.params.unitId;
  next();
}, deleteUnit);

// Quiz history
subjectsRouter.get("/:id/quiz-history", authorize("teacher"), getQuizHistoryBySubject);

export default subjectsRouter;
