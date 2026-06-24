import { z } from "zod";

const MAX_TITLE_LENGTH = 255;
const MAX_BATCH_LENGTH = 50;
const MAX_DIVISION_LENGTH = 10;
const MAX_GROUP_LENGTH = 50;
const MAX_ACCESS_CODE_LENGTH = 20;
const MAX_NEW_UNIT_LENGTH = 100;
const DEFAULT_DURATION_MINS = 15;
const MAX_SEARCH_LENGTH = 255;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const quizStatusSchema = z.enum(["draft", "active", "ended", "scheduled"]);

const quizMetaSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
  subject_id: z.coerce.number().int().positive(),
  duration_mins: z.coerce.number().int().positive().optional().default(DEFAULT_DURATION_MINS),
  batch: z.string().trim().max(MAX_BATCH_LENGTH).optional().nullable(),
  division: z.string().trim().max(MAX_DIVISION_LENGTH).optional().nullable(),
  group_nos: z.string().trim().max(MAX_GROUP_LENGTH).optional().nullable(),
  quiz_date: z.string().date().optional().nullable(),
  scheduled_start: z.string().trim().optional().nullable(),
  scheduled_end: z.string().trim().optional().nullable(),
  access_code: z.string().trim().max(MAX_ACCESS_CODE_LENGTH).optional().nullable(),
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
  new_unit_name: z.string().trim().min(1).max(MAX_NEW_UNIT_LENGTH).optional().nullable(),
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
    title: z.string().trim().min(1).max(MAX_TITLE_LENGTH).optional(),
    duration_mins: z.coerce.number().int().positive().optional(),
    batch: z.string().trim().max(MAX_BATCH_LENGTH).optional().nullable(),
    division: z.string().trim().max(MAX_DIVISION_LENGTH).optional().nullable(),
    group_nos: z.string().trim().max(MAX_GROUP_LENGTH).optional().nullable(),
    quiz_date: z.string().date().optional().nullable(),
    scheduled_start: z.string().trim().optional().nullable(),
    scheduled_end: z.string().trim().optional().nullable(),
    access_code: z.string().trim().max(MAX_ACCESS_CODE_LENGTH).optional().nullable(),
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
  search: z.string().trim().max(MAX_SEARCH_LENGTH).optional(),
  status: quizStatusSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(MAX_LIMIT).optional().default(DEFAULT_LIMIT),
});

export const quizIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const subjectIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
