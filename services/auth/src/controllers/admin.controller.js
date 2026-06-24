import { z } from "zod";

import {
  schoolParamSchema,
  teacherIdParamSchema,
} from "../validators/admin.validator.js";
import * as adminService from "../services/admin.service.js";

const CREATED = 201;
const OK = 200;
const BAD_REQUEST = 400;

export async function getAllTeachers(_req, res, next) {
  try {
    return res.status(OK).json(await adminService.getAllTeachers());
  } catch (error) {
    return next(error);
  }
}

export async function removeTeacherFromSchool(req, res, next) {
  try {
    const { id } = teacherIdParamSchema.parse(req.params);
    return res.status(OK).json(await adminService.removeTeacherFromSchool(id));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(BAD_REQUEST).json({ error: "Invalid teacher id" });
    }
    return next(error);
  }
}

export async function getTeachersBySchool(req, res, next) {
  try {
    const { school } = schoolParamSchema.parse(req.params);
    return res.status(OK).json(await adminService.getTeachersBySchool(school));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(BAD_REQUEST).json({ error: "Invalid school value. Use SOT, SLS, or SOET." });
    }
    return next(error);
  }
}

export async function addTeacher(req, res, next) {
  try {
    return res.status(CREATED).json(await adminService.addTeacher(req.validatedBody));
  } catch (error) {
    return next(error);
  }
}

export async function assignSubjects(req, res, next) {
  try {
    const { id } = teacherIdParamSchema.parse(req.params);
    const result = await adminService.assignSubjects(id, req.validatedBody.subject_ids);
    return res.status(OK).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(BAD_REQUEST).json({ error: "Invalid teacher id or subject assignment payload" });
    }
    return next(error);
  }
}

export async function getTeacherCredentials(req, res, next) {
  try {
    const { id } = teacherIdParamSchema.parse(req.params);
    return res.status(OK).json(await adminService.getTeacherCredentials(id));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(BAD_REQUEST).json({ error: "Invalid teacher id" });
    }
    return next(error);
  }
}

export async function deleteTeacher(req, res, next) {
  try {
    const { id } = teacherIdParamSchema.parse(req.params);
    return res.status(OK).json(await adminService.deleteTeacher(id));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(BAD_REQUEST).json({ error: "Invalid teacher id" });
    }
    return next(error);
  }
}
