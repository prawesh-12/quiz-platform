import { z } from "zod";

import {
  listQuestionsQuerySchema,
  questionIdParamSchema,
} from "../validators/questions.validator.js";
import * as questionService from "../services/questions.service.js";

export async function listQuestions(req, res, next) {
  try {
    const query = listQuestionsQuerySchema.parse(req.query);
    const result = await questionService.listQuestions({ userId: req.user.userId, query });
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
      userId: req.user.userId,
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
      userId: req.user.userId,
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
      userId: req.user.userId,
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
    const result = await questionService.deleteQuestion({ id, userId: req.user.userId });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid question id" });
    }
    return next(error);
  }
}
