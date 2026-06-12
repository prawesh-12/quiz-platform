import { z } from "zod";

export const quizStatusSchema = z.enum(["draft", "active", "ended", "scheduled"]);

const quizMetaSchema = z.object({
  title: z.string().trim().min(1).max(255),
  subject_id: z.coerce.number().int().positive(),
  duration_mins: z.coerce.number().int().positive().optional().default(15),
  batch: z.string().trim().max(50).optional().nullable(),
  division: z.string().trim().max(10).optional().nullable(),
  group_nos: z.string().trim().max(50).optional().nullable(),
  quiz_date: z.string().date().optional().nullable(),
  scheduled_start: z.string().trim().optional().nullable(),
  scheduled_end: z.string().trim().optional().nullable(),
  access_code: z.string().trim().max(20).optional().nullable(),
  status: quizStatusSchema.optional().default("draft"),
});

const questionPayloadSchema = z.object({
  question_text: z.string().trim().min(1),
  option_a: z.string().trim().min(1),
  option_b: z.string().trim().min(1),
  option_c: z.string().trim().optional().nullable(),
  option_d: z.string().trim().optional().nullable(),
  correct_option: z.enum(["a", "b", "c", "d"]),
  points: z.coerce.number().int().positive().optional().default(1),
  has_equation: z.boolean().optional().default(false),
  allow_multiple_answers: z.boolean().optional().default(false),
  is_required: z.boolean().optional().default(true),
  unit_id: z.coerce.number().int().positive().optional().nullable(),
  new_unit_name: z.string().trim().min(1).max(100).optional().nullable(),
  in_subject_bank: z.boolean().optional().default(false),
});

export const createManualQuizSchema = quizMetaSchema.extend({
  questions: z.array(questionPayloadSchema).min(1),
});

export const autoGenerateQuizSchema = quizMetaSchema.extend({
  unit_selections: z
    .array(
      z.object({
        unit_id: z.coerce.number().int().positive(),
        count: z.coerce.number().int().positive(),
      }),
    )
    .min(1, "Select at least 1 question"),
});

export const updateQuizSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    duration_mins: z.coerce.number().int().positive().optional(),
    batch: z.string().trim().max(50).optional().nullable(),
    division: z.string().trim().max(10).optional().nullable(),
    group_nos: z.string().trim().max(50).optional().nullable(),
    quiz_date: z.string().date().optional().nullable(),
    scheduled_start: z.string().trim().optional().nullable(),
    scheduled_end: z.string().trim().optional().nullable(),
    access_code: z.string().trim().max(20).optional().nullable(),
    status: quizStatusSchema.optional(),
    question_ids: z.array(z.coerce.number().int().positive()).min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const updateQuizStatusSchema = z.object({
  status: z.enum(["active", "ended"]),
});

export const listQuizzesQuerySchema = z.object({
  search: z.string().trim().max(255).optional(),
  status: quizStatusSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const quizIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
