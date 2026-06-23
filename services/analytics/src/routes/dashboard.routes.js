import { Router } from "express";

import {
  getAdminDashboardSummary,
  getAdminDashboardTrend,
  getTeacherDashboardSummary,
  getTeacherDashboardTrend
} from "../controllers/dashboard.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const adminRouter = Router();
adminRouter.use(authenticate, authorize("admin"));
adminRouter.get("/summary", getAdminDashboardSummary);
adminRouter.get("/trend", getAdminDashboardTrend);

const teacherRouter = Router();
teacherRouter.use(authenticate, authorize("teacher"));
teacherRouter.get("/summary", getTeacherDashboardSummary);
teacherRouter.get("/trend", getTeacherDashboardTrend);

export { adminRouter, teacherRouter };
