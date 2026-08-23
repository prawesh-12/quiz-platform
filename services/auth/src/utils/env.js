import { z } from "zod";

import logger from "./logger.js";

// Parse a positive-integer environment variable, falling back when unset or invalid.
export function readPositiveIntegerEnv(name, fallback) {
  const rawValue = process.env[name];

  if (rawValue == null || rawValue === "") {
    return fallback;
  }

  const value = Number(rawValue);
  if (Number.isInteger(value) && value > 0) {
    return value;
  }

  logger.warn("env.invalid_integer", { name, rawValue, fallback });
  return fallback;
}

const requiredEnvSchema = z.object({
  CLIENT_URLS: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1)
});

// Validate required env at startup; fail fast with a clear message when missing.
export function validateRequiredEnv() {
  const parsed = requiredEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = Object.keys(parsed.error.flatten().fieldErrors);
    throw new Error(`Missing or invalid required env: ${missing.join(", ")}`);
  }
  return parsed.data;
}
