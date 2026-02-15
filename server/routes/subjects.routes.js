import { Router } from "express";

import { createSubject, createSubjectSchema, deleteSubject, listSubjects } from "../controllers/subjects.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";

const subjectsRouter = Router();

subjectsRouter.use(authenticate, authorize("teacher"));
subjectsRouter.get("/", listSubjects);
subjectsRouter.post("/", validate(createSubjectSchema), createSubject);
subjectsRouter.delete("/:id", deleteSubject);

export default subjectsRouter;
