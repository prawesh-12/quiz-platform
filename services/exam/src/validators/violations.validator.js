import { z } from "zod";

const violationTypeSchema = z.enum([
  "tab_switch",
  "window_blur",
  "screenshot_attempt",
  "copy_shortcut",
  "copy_event",
  "context_menu",
]);

export const violationHeadersSchema = z.object({
  "x-session-token": z.string().trim().min(8).max(128),
});

export const listViolationsQuerySchema = z.object({
  session_id: z.coerce.number().int().positive(),
});

export const createViolationSchema = z.object({
  type: violationTypeSchema,
  description: z.string().trim().max(500).optional().nullable(),
});
