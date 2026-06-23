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
import rateLimit from "../middleware/rateLimit.js";
import validate from "../middleware/validate.js";

const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000;
const AUTH_RATE_MAX = 20;

const authRateLimit = rateLimit({
  keyGenerator: (req, { ip }) => `auth:${ip}`,
  max: AUTH_RATE_MAX,
  windowMs: AUTH_RATE_WINDOW_MS,
  message: "Too many authentication attempts. Please try again later."
});

const authRouter = Router();

authRouter.post("/register", authRateLimit, validate(registerSchema), register);
authRouter.post("/login", authRateLimit, validate(loginSchema), login);
authRouter.post("/logout", authenticate, authorize("teacher", "admin"), logout);
authRouter.get("/me", authenticate, authorize("teacher", "admin"), me);
authRouter.put("/profile", authenticate, authorize("teacher"), validate(updateProfileSchema), updateProfile);
authRouter.put("/change-password", authenticate, authorize("teacher"), validate(changePasswordSchema), changePassword);

export default authRouter;
