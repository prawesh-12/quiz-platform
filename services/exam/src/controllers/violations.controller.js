import { z } from "zod";

import {
  listViolationsQuerySchema,
  violationHeadersSchema,
} from "../validators/violations.validator.js";
import * as violationService from "../services/violations.service.js";

export async function createViolation(req, res, next) {
  try {
    const { "x-session-token": sessionToken } = violationHeadersSchema.parse(req.headers);
    const result = await violationService.createViolation({
      sessionToken,
      payload: req.validatedBody,
    });
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Missing or invalid session token header" });
    }
    return next(error);
  }
}

export async function getViolationsBySession(req, res, next) {
  try {
    const { session_id: sessionId } = listViolationsQuerySchema.parse(req.query);
    const result = await violationService.getViolationsBySession({
      sessionId,
      userId: req.user.userId,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "session_id query param is required and must be a positive integer" });
    }
    return next(error);
  }
}
