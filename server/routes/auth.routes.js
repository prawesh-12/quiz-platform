import { Router } from "express";

import {
  changePassword,
  login,
  logout,
  me,
  register,
  updateProfile
} from "../controllers/auth.controller.js";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema
} from "../validators/auth.validator.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/logout", authenticate, authorize("teacher", "admin"), logout);
authRouter.get("/me", authenticate, authorize("teacher", "admin"), me);
authRouter.put("/profile", authenticate, authorize("teacher"), validate(updateProfileSchema), updateProfile);
authRouter.put("/change-password", authenticate, authorize("teacher"), validate(changePasswordSchema), changePassword);

export default authRouter;
