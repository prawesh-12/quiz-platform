import { Router } from "express";

import {
  getTeacherDashboardSummary,
  getTeacherDashboardTrend
} from "../controllers/dashboard.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const teachersRouter = Router();

teachersRouter.get("/dashboard/summary", authenticate, authorize("teacher"), getTeacherDashboardSummary);
teachersRouter.get("/dashboard/trend", authenticate, authorize("teacher"), getTeacherDashboardTrend);

export default teachersRouter;
