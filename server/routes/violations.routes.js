import { Router } from "express";

import {
  createViolation,
  createViolationSchema,
  getViolationsBySession
} from "../controllers/violations.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";

const violationsRouter = Router();

violationsRouter.post("/", validate(createViolationSchema), createViolation);
violationsRouter.get("/", authenticate, authorize("teacher"), getViolationsBySession);

export default violationsRouter;
