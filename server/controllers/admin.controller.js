import { z } from "zod";

import {
  schoolParamSchema,
  subjectIdParamSchema,
  teacherIdParamSchema,
} from "../validators/admin.validator.js";
import * as adminService from "../services/admin.service.js";

export async function getAllTeachers(_req, res, next) {
  try {
    return res.status(200).json(await adminService.getAllTeachers());
  } catch (error) {
    return next(error);
  }
}

export async function removeTeacherFromSchool(req, res, next) {
  try {
    const { id } = teacherIdParamSchema.parse(req.params);
    return res.status(200).json(await adminService.removeTeacherFromSchool(id));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid teacher id" });
    }
    return next(error);
  }
}

export async function getTeachersBySchool(req, res, next) {
  try {
    const { school } = schoolParamSchema.parse(req.params);
    return res.status(200).json(await adminService.getTeachersBySchool(school));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid school value. Use SOT, SLS, or SOET." });
    }
    return next(error);
  }
}

export async function addTeacher(req, res, next) {
  try {
    return res.status(201).json(await adminService.addTeacher(req.validatedBody));
  } catch (error) {
    return next(error);
  }
}

export async function assignSubjects(req, res, next) {
  try {
    const { id } = teacherIdParamSchema.parse(req.params);
    const result = await adminService.assignSubjects(id, req.validatedBody.subject_ids);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid teacher id or subject assignment payload" });
    }
    return next(error);
  }
}

export async function getTeacherCredentials(req, res, next) {
  try {
    const { id } = teacherIdParamSchema.parse(req.params);
    return res.status(200).json(await adminService.getTeacherCredentials(id));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid teacher id" });
    }
    return next(error);
  }
}

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

export async function deleteTeacher(req, res, next) {
  try {
    const { id } = teacherIdParamSchema.parse(req.params);
    return res.status(200).json(await adminService.deleteTeacher(id));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid teacher id" });
    }
    return next(error);
  }
}
