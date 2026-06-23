import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
});

export const subjectIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
