import multer from "multer";
import { Router } from "express";

import {
  deleteAvatar,
  getMyAvatar,
  getTeacherAvatar,
  uploadAvatar
} from "../controllers/avatars.controller.js";
import { getMyProfile } from "../controllers/profile.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const BAD_REQUEST = 400;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const teachersRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("Only JPEG, PNG, or WebP images are allowed"));
  }
});

function handleAvatarUpload(req, res, next) {
  upload.single("avatar")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(BAD_REQUEST).json({ error: "Avatar file must be 2MB or smaller" });
      return;
    }

    res.status(BAD_REQUEST).json({ error: error.message || "Invalid avatar upload" });
  });
}

teachersRouter.get("/me", authenticate, authorize("teacher", "admin"), getMyProfile);
teachersRouter.get("/me/avatar", authenticate, authorize("teacher"), getMyAvatar);
teachersRouter.put("/me/avatar", authenticate, authorize("teacher"), handleAvatarUpload, uploadAvatar);
teachersRouter.delete("/me/avatar", authenticate, authorize("teacher"), deleteAvatar);
teachersRouter.get("/:id/avatar", authenticate, authorize("teacher", "admin"), getTeacherAvatar);

export default teachersRouter;
