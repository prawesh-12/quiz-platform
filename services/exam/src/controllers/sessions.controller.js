import { z } from "zod";

import {
  answerParamsSchema,
  sessionHeadersSchema,
} from "../validators/sessions.validator.js";
import * as sessionService from "../services/sessions.service.js";

const HEADER_ERROR = "Missing or invalid session token header";

function sessionTokenFromHeaders(headers) {
  return sessionHeadersSchema.parse(headers)["x-session-token"];
}

export async function getSessionTiming(req, res, next) {
  try {
    const token = sessionTokenFromHeaders(req.headers);
    return res.status(200).json(await sessionService.getSessionTiming(token));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: HEADER_ERROR });
    }
    return next(error);
  }
}

export async function getSessionResult(req, res, next) {
  try {
    const token = sessionTokenFromHeaders(req.headers);
    return res.status(200).json(await sessionService.getSessionResult(token));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: HEADER_ERROR });
    }
    return next(error);
  }
}

export async function enterSession(req, res, next) {
  try {
    return res.status(200).json(await sessionService.enterSession(req.validatedBody));
  } catch (error) {
    return next(error);
  }
}

export async function saveSessionProgress(req, res, next) {
  try {
    const token = sessionTokenFromHeaders(req.headers);
    return res.status(200).json(await sessionService.saveAnswers(token, req.validatedBody.answers));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: HEADER_ERROR });
    }
    return next(error);
  }
}

export async function saveSessionAnswer(req, res, next) {
  let questionId;
  try {
    ({ questionId } = answerParamsSchema.parse(req.params));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid question id" });
    }
    return next(error);
  }

  try {
    const token = sessionTokenFromHeaders(req.headers);
    const answers = [{ question_id: questionId, selected_option: req.validatedBody.selected_option }];
    return res.status(200).json(await sessionService.saveAnswers(token, answers));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: HEADER_ERROR });
    }
    return next(error);
  }
}

export async function submitSession(req, res, next) {
  try {
    const token = sessionTokenFromHeaders(req.headers);
    const { answers, submission_id: submissionId = null } = req.validatedBody;
    return res.status(200).json(await sessionService.submitSession(token, { answers, submissionId }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: HEADER_ERROR });
    }
    return next(error);
  }
}
