import pool from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import * as avatars from "../repositories/avatars.repository.js";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function saveAvatar({ teacherId, file }) {
  if (!file) {
    throw new AppError(400, "Avatar file is required");
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new AppError(400, "Only JPEG, PNG, or WebP images are allowed");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new AppError(400, "Avatar file must be 2MB or smaller");
  }

  const updated = await avatars.setAvatar(pool, teacherId, file.buffer, file.mimetype);
  if (!updated) {
    throw new AppError(404, "Teacher not found");
  }

  return { message: "Avatar updated", has_avatar: true };
}

// Returns { data, mime } for streaming, or throws 404 when the teacher or avatar is absent.
export async function getAvatar(teacherId) {
  const row = await avatars.findAvatar(pool, teacherId);
  if (!row) {
    throw new AppError(404, "Teacher not found");
  }
  if (!row.avatar_data || !row.avatar_mime) {
    throw new AppError(404, "Avatar not found");
  }

  return { data: row.avatar_data, mime: row.avatar_mime };
}

export async function getAvatarForRequester({ targetId, requesterRole, requesterId }) {
  if (requesterRole !== "admin" && requesterId !== targetId) {
    throw new AppError(403, "Forbidden");
  }

  return getAvatar(targetId);
}

export async function removeAvatar(teacherId) {
  const updated = await avatars.clearAvatar(pool, teacherId);
  if (!updated) {
    throw new AppError(404, "Teacher not found");
  }

  return { message: "Avatar removed", has_avatar: false };
}
