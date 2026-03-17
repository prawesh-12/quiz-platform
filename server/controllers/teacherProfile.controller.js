import { query } from "../config/db.js";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function parseTeacherId(rawId) {
  const teacherId = Number(rawId);
  if (!Number.isInteger(teacherId) || teacherId <= 0) {
    return null;
  }
  return teacherId;
}

async function fetchAvatarByTeacherId(teacherId) {
  return query(
    `
    SELECT id, avatar_data, avatar_mime
    FROM teachers
    WHERE id = $1
    `,
    [teacherId]
  );
}

function sendAvatarOr404(res, row) {
  if (!row.avatar_data || !row.avatar_mime) {
    return res.status(404).json({ error: "Avatar not found" });
  }

  res.set("Content-Type", row.avatar_mime);
  res.set("Cache-Control", "private, max-age=86400");
  return res.send(row.avatar_data);
}

export async function uploadAvatar(req, res, next) {
  try {
    const teacherId = parseTeacherId(req.user?.userId ?? req.user?.id);
    if (!teacherId) {
      return res.status(401).json({ error: "Invalid teacher token" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Avatar file is required" });
    }

    if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
      return res.status(400).json({ error: "Only JPEG, PNG, or WebP images are allowed" });
    }

    if (req.file.size > MAX_AVATAR_BYTES) {
      return res.status(400).json({ error: "Avatar file must be 2MB or smaller" });
    }

    const result = await query(
      `
      UPDATE teachers
      SET avatar_data = $1,
          avatar_mime = $2,
          has_avatar = TRUE
      WHERE id = $3
      RETURNING id
      `,
      [req.file.buffer, req.file.mimetype, teacherId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    return res.status(200).json({ message: "Avatar updated", has_avatar: true });
  } catch (error) {
    return next(error);
  }
}

export async function getMyAvatar(req, res, next) {
  try {
    const teacherId = parseTeacherId(req.user?.userId ?? req.user?.id);
    if (!teacherId) {
      return res.status(401).json({ error: "Invalid teacher token" });
    }

    const result = await fetchAvatarByTeacherId(teacherId);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    return sendAvatarOr404(res, result.rows[0]);
  } catch (error) {
    return next(error);
  }
}

export async function getTeacherAvatar(req, res, next) {
  try {
    const teacherId = parseTeacherId(req.params.id);
    if (!teacherId) {
      return res.status(400).json({ error: "Invalid teacher id" });
    }

    if (req.user?.role !== "admin") {
      const requesterId = parseTeacherId(req.user?.userId ?? req.user?.id);
      if (!requesterId) {
        return res.status(401).json({ error: "Invalid teacher token" });
      }

      if (requesterId !== teacherId) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const result = await fetchAvatarByTeacherId(teacherId);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    return sendAvatarOr404(res, result.rows[0]);
  } catch (error) {
    return next(error);
  }
}

export async function deleteAvatar(req, res, next) {
  try {
    const teacherId = parseTeacherId(req.user?.userId ?? req.user?.id);
    if (!teacherId) {
      return res.status(401).json({ error: "Invalid teacher token" });
    }

    const result = await query(
      `
      UPDATE teachers
      SET avatar_data = NULL,
          avatar_mime = NULL,
          has_avatar = FALSE
      WHERE id = $1
      RETURNING id
      `,
      [teacherId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    return res.status(200).json({ message: "Avatar removed", has_avatar: false });
  } catch (error) {
    return next(error);
  }
}
