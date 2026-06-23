import { z } from "zod";

const options = ["a", "b", "c", "d"];

const questionInputSchema = z.object({
  question_text: z.string().trim().min(1),
  option_a: z.string().trim().min(1),
  option_b: z.string().trim().min(1),
  option_c: z.string().trim().optional().nullable(),
  option_d: z.string().trim().optional().nullable(),
  correct_option: z.enum(options),
  points: z.coerce.number().int().positive().optional().default(1),
  has_equation: z.boolean().optional().default(false),
  allow_multiple_answers: z.boolean().optional().default(false),
  is_required: z.boolean().optional().default(true),
  unit_id: z.coerce.number().int().positive().optional().nullable(),
  in_subject_bank: z.boolean().optional().default(false),
});

export const createQuestionSchema = questionInputSchema.extend({
  subject_id: z.coerce.number().int().positive(),
});

export const bulkImportQuestionsSchema = z.object({
  subject_id: z.coerce.number().int().positive(),
  questions: z.array(questionInputSchema).min(1),
});

export const updateQuestionSchema = z
  .object({
    question_text: z.string().trim().min(1).optional(),
    option_a: z.string().trim().min(1).optional(),
    option_b: z.string().trim().min(1).optional(),
    option_c: z.string().trim().optional().nullable(),
    option_d: z.string().trim().optional().nullable(),
    correct_option: z.enum(options).optional(),
    points: z.coerce.number().int().positive().optional(),
    has_equation: z.boolean().optional(),
    allow_multiple_answers: z.boolean().optional(),
    is_required: z.boolean().optional(),
    unit_id: z.coerce.number().int().positive().optional().nullable(),
    in_subject_bank: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const questionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listQuestionsQuerySchema = z.object({
  subject_id: z.coerce.number().int().positive(),
  search: z.string().trim().max(255).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  in_subject_bank: z.enum(["true", "false"]).optional(),
  unit_id: z.coerce.number().int().optional().nullable(),
});
