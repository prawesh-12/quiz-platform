import { z } from "zod";

const optionSchema = z.enum(["a", "b", "c", "d"]);

const answerPayloadSchema = z.object({
  question_id: z.coerce.number().int().positive(),
  selected_option: optionSchema.optional().nullable(),
});

export const enterSessionSchema = z.object({
  access_token: z.string().trim().min(8).max(64),
  access_code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(2).max(100),
  roll_no: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(150),
  division: z.string().trim().min(1).max(10),
  group_no: z.string().trim().min(1).max(10),
});

export const submitSessionSchema = z.object({
  answers: z.array(answerPayloadSchema).default([]),
  submission_id: z.string().trim().min(1).max(64).optional(),
});

export const progressSessionSchema = z.object({
  answers: z.array(answerPayloadSchema).default([]),
});

export const answerProgressSchema = z.object({
  selected_option: optionSchema.nullable(),
});

export const sessionHeadersSchema = z.object({
  "x-session-token": z.string().trim().min(8).max(128),
});

export const answerParamsSchema = z.object({
  questionId: z.coerce.number().int().positive(),
});
