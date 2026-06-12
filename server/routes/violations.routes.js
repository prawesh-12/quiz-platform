import { Router } from "express";

import {
  createViolation,
  createViolationSchema,
  getViolationsBySession
} from "../controllers/violations.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import rateLimit from "../middleware/rateLimit.js";
import validate from "../middleware/validate.js";

const violationsRouter = Router();

const violationRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req, { ip }) => `violation:${req.headers["x-session-token"] || ip}`,
  message: "Too many violation reports. Please slow down."
});

violationsRouter.post("/", violationRateLimit, validate(createViolationSchema), createViolation);
violationsRouter.get("/", authenticate, authorize("teacher"), getViolationsBySession);

export default violationsRouter;
