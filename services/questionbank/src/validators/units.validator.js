import { z } from "zod";

export const unitInputSchema = z.object({
  name: z.string().trim().min(1).max(150),
});

export const unitIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const subjectIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
