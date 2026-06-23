import { Router } from "express";

import {
  addTeacher,
  assignSubjects,
  deleteTeacher,
  getAllSubjectsForAdmin,
  getAllTeachers,
  getTeacherCredentials,
  getTeachersBySchool,
  getSubjectQuestionsForAdmin,
  removeTeacherFromSchool
} from "../controllers/admin.controller.js";
import {
  getAdminDashboardSummary,
  getAdminDashboardTrend
} from "../controllers/dashboard.controller.js";
import { addTeacherSchema, assignSubjectsSchema } from "../validators/admin.validator.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";

const adminRouter = Router();

adminRouter.use(authenticate, authorize("admin"));
adminRouter.get("/dashboard/summary", getAdminDashboardSummary);
adminRouter.get("/dashboard/trend", getAdminDashboardTrend);
adminRouter.get("/teachers", getAllTeachers);
adminRouter.get("/schools/:school/teachers", getTeachersBySchool);
adminRouter.post("/teachers", validate(addTeacherSchema), addTeacher);
adminRouter.put("/teachers/:id/subjects", validate(assignSubjectsSchema), assignSubjects);
adminRouter.get("/teachers/:id/credentials", getTeacherCredentials);
adminRouter.patch("/teachers/:id/remove-school", removeTeacherFromSchool);
adminRouter.delete("/teachers/:id", deleteTeacher);
adminRouter.get("/subjects", getAllSubjectsForAdmin);
adminRouter.get("/subjects/:id/questions", getSubjectQuestionsForAdmin);

export default adminRouter;
