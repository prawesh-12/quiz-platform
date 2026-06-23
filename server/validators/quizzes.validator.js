import { z } from "zod";

export const quizIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
