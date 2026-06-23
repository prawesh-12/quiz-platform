import { Router } from "express";

import {
  getAllSubjectsForAdmin,
  getSubjectQuestionsForAdmin
} from "../controllers/admin.controller.js";
import {
  getAdminDashboardSummary,
  getAdminDashboardTrend
} from "../controllers/dashboard.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const adminRouter = Router();

adminRouter.use(authenticate, authorize("admin"));
adminRouter.get("/dashboard/summary", getAdminDashboardSummary);
adminRouter.get("/dashboard/trend", getAdminDashboardTrend);
adminRouter.get("/subjects", getAllSubjectsForAdmin);
adminRouter.get("/subjects/:id/questions", getSubjectQuestionsForAdmin);

export default adminRouter;
