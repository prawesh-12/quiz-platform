import multer from "multer";
import { Router } from "express";

import {
  deleteAvatar,
  getMyAvatar,
  getTeacherAvatar,
  uploadAvatar
} from "../controllers/teacherProfile.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const teachersRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimeTypes.includes(file.mimetype)) {
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
      res.status(400).json({ error: "Avatar file must be 2MB or smaller" });
      return;
    }

    res.status(400).json({ error: error.message || "Invalid avatar upload" });
  });
}

teachersRouter.get("/me/avatar", authenticate, authorize("teacher"), getMyAvatar);
teachersRouter.put("/me/avatar", authenticate, authorize("teacher"), handleAvatarUpload, uploadAvatar);
teachersRouter.delete("/me/avatar", authenticate, authorize("teacher"), deleteAvatar);
teachersRouter.get("/:id/avatar", authenticate, authorize("teacher", "admin"), getTeacherAvatar);

export default teachersRouter;
