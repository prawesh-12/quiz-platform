import { z } from "zod";

export const subjectIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
