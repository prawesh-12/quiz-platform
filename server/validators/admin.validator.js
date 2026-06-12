import { z } from "zod";

export const SCHOOL_VALUES = ["SOT", "SLS", "SOET"];

const schoolValueSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }
  return value.trim().toUpperCase();
}, z.enum(SCHOOL_VALUES));

export const schoolParamSchema = z.object({
  school: schoolValueSchema,
});

export const teacherIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const subjectIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const addTeacherSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  password: z.string().min(8).max(128),
  school: schoolValueSchema,
  contact_no: z.string().trim().max(20).optional().nullable(),
  subject_ids: z.array(z.coerce.number().int().positive()).optional().default([]),
});

export const assignSubjectsSchema = z.object({
  subject_ids: z.array(z.coerce.number().int().positive()).optional().default([]),
});
