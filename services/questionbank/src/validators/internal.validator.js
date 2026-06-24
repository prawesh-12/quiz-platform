import { z } from "zod";

const unitSelectionSchema = z.object({
  unit_id: z.coerce.number().int().positive(),
  count: z.coerce.number().int().positive(),
});

export const selectQuestionsSchema = z.object({
  subjectId: z.coerce.number().int().positive(),
  unitSelections: z.array(unitSelectionSchema).min(1),
});

export const adminSubjectIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
