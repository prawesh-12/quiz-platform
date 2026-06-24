import { z } from "zod";

import {
  listQuestionsQuerySchema,
  questionIdParamSchema,
} from "../validators/questions.validator.js";
import * as questionService from "../services/questions.service.js";

function getUserId(req) {
  return req.user.userId ?? req.user.id;
}

export async function listQuestions(req, res, next) {
  try {
    const query = listQuestionsQuerySchema.parse(req.query);
    const result = await questionService.listQuestions({ userId: getUserId(req), query });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "subject_id query param is required and must be a positive integer" });
    }
    return next(error);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    const { id } = questionIdParamSchema.parse(req.params);
    const result = await questionService.updateQuestion({
      id,
      userId: getUserId(req),
      payload: req.validatedBody,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid question id or payload" });
    }
    return next(error);
  }
}

export async function createQuestion(req, res, next) {
  try {
    const result = await questionService.createQuestion({
      userId: getUserId(req),
      payload: req.validatedBody,
    });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function bulkImportQuestions(req, res, next) {
  try {
    const result = await questionService.bulkImportQuestions({
      userId: getUserId(req),
      payload: req.validatedBody,
    });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    const { id } = questionIdParamSchema.parse(req.params);
    const result = await questionService.deleteQuestion({ id, userId: getUserId(req) });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid question id" });
    }
    return next(error);
  }
}
