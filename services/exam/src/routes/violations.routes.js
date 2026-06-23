import { Router } from "express";

import {
  createViolation,
  getViolationsBySession
} from "../controllers/violations.controller.js";
import { createViolationSchema } from "../validators/violations.validator.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import rateLimit from "../middleware/rateLimit.js";
import validate from "../middleware/validate.js";

const VIOLATION_WINDOW_MS = 60 * 1000;
const VIOLATION_MAX = 20;

const violationsRouter = Router();

const violationRateLimit = rateLimit({
  windowMs: VIOLATION_WINDOW_MS,
  max: VIOLATION_MAX,
  keyGenerator: (req, { ip }) => `violation:${req.headers["x-session-token"] || ip}`,
  message: "Too many violation reports. Please slow down."
});

violationsRouter.post("/", violationRateLimit, validate(createViolationSchema), createViolation);
violationsRouter.get("/", authenticate, authorize("teacher"), getViolationsBySession);

export default violationsRouter;
