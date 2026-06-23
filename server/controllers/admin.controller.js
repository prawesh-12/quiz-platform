import { z } from "zod";

import { subjectIdParamSchema } from "../validators/admin.validator.js";
import * as adminService from "../services/admin.service.js";

export async function getAllSubjectsForAdmin(_req, res, next) {
  try {
    return res.status(200).json(await adminService.getAllSubjectsForAdmin());
  } catch (error) {
    return next(error);
  }
}

export async function getSubjectQuestionsForAdmin(req, res, next) {
  try {
    const { id } = subjectIdParamSchema.parse(req.params);
    return res.status(200).json(await adminService.getSubjectQuestionsForAdmin(id));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid subject id" });
    }
    return next(error);
  }
}
