import * as avatarService from "../services/avatars.service.js";

function parseTeacherId(rawId) {
  const teacherId = Number(rawId);
  if (!Number.isInteger(teacherId) || teacherId <= 0) {
    return null;
  }
  return teacherId;
}

function sendAvatar(res, { data, mime }) {
  res.set("Content-Type", mime);
  res.set("Cache-Control", "private, max-age=86400");
  return res.send(data);
}

export async function uploadAvatar(req, res, next) {
  try {
    const teacherId = parseTeacherId(req.user?.userId ?? req.user?.id);
    if (!teacherId) {
      return res.status(401).json({ error: "Invalid teacher token" });
    }

    const result = await avatarService.saveAvatar({ teacherId, file: req.file });
    return res.status(200).json(result);
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

    return sendAvatar(res, await avatarService.getAvatar(teacherId));
  } catch (error) {
    return next(error);
  }
}

export async function getTeacherAvatar(req, res, next) {
  try {
    const targetId = parseTeacherId(req.params.id);
    if (!targetId) {
      return res.status(400).json({ error: "Invalid teacher id" });
    }

    let requesterId = null;
    if (req.user?.role !== "admin") {
      requesterId = parseTeacherId(req.user?.userId ?? req.user?.id);
      if (!requesterId) {
        return res.status(401).json({ error: "Invalid teacher token" });
      }
    }

    const avatar = await avatarService.getAvatarForRequester({
      targetId,
      requesterRole: req.user?.role,
      requesterId,
    });
    return sendAvatar(res, avatar);
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

    return res.status(200).json(await avatarService.removeAvatar(teacherId));
  } catch (error) {
    return next(error);
  }
}
