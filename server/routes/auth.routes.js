import { Router } from "express";

import {
  changePassword,
  changePasswordSchema,
  login,
  loginSchema,
  me,
  register,
  registerSchema,
  updateProfile,
  updateProfileSchema
} from "../controllers/auth.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.get("/me", authenticate, authorize("teacher"), me);
authRouter.put("/profile", authenticate, authorize("teacher"), validate(updateProfileSchema), updateProfile);
authRouter.put("/change-password", authenticate, authorize("teacher"), validate(changePasswordSchema), changePassword);

export default authRouter;
