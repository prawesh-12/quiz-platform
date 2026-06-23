import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(1),
  role: z.enum(["teacher", "admin"]).optional().default("teacher"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1),
    new_password: z.string().min(8).max(128),
    confirm_new_password: z.string().min(8).max(128),
  })
  .refine((value) => value.new_password === value.confirm_new_password, {
    message: "New passwords do not match",
  });
