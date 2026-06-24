import { z } from "zod";

import {
  listQuizzesQuerySchema,
  quizIdParamSchema,
} from "../validators/quizzes.validator.js";
import * as quizService from "../services/quizzes.service.js";

function buildShareUrl(accessToken) {
  return accessToken ? `${process.env.CLIENT_URL}/quiz/enter/${accessToken}` : null;
}

export async function listQuizzes(req, res, next) {
  try {
    const query = listQuizzesQuerySchema.parse(req.query);
    const result = await quizService.listQuizzes({ userId: req.user.userId, ...query });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid query params for quizzes list" });
    }
    return next(error);
  }
}

export async function createManualQuiz(req, res, next) {
  try {
    const result = await quizService.createManualQuiz({
      userId: req.user.userId,
      payload: req.validatedBody,
    });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function autoGenerateQuiz(req, res, next) {
  try {
    const result = await quizService.autoGenerateQuiz({
      userId: req.user.userId,
      payload: req.validatedBody,
    });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function getQuizById(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);
    const result = await quizService.getQuizWithQuestions({ id, userId: req.user.userId });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }
    return next(error);
  }
}

export async function updateQuiz(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);
    const { quiz } = await quizService.updateQuiz({
      id,
      userId: req.user.userId,
      payload: req.validatedBody,
    });
    return res.status(200).json({ quiz, share_url: buildShareUrl(quiz.access_token) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input for quiz update" });
    }
    return next(error);
  }
}

export async function updateQuizStatus(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);
    const { quiz, autoSubmittedCount } = await quizService.changeQuizStatus({
      id,
      userId: req.user.userId,
      status: req.validatedBody.status,
    });
    return res.status(200).json({
      quiz,
      auto_submitted_count: autoSubmittedCount,
      share_url: buildShareUrl(quiz?.access_token),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id or status" });
    }
    return next(error);
  }
}

export async function deleteQuiz(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);
    await quizService.removeQuiz({ id, userId: req.user.userId });
    return res.status(200).json({ message: "Quiz deleted" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }
    return next(error);
  }
}

export async function getQuizPreview(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);
    const result = await quizService.getPreview({ id, userId: req.user.userId });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }
    return next(error);
  }
}

export async function duplicateQuiz(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);
    const result = await quizService.duplicateQuiz({ id, userId: req.user.userId });
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }
    return next(error);
  }
}
