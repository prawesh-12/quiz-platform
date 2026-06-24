import { z } from "zod";

import { quizIdParamSchema } from "../validators/quizzes.validator.js";
import { responsesQuerySchema } from "../validators/responses.validator.js";
import * as responseService from "../services/responses.service.js";

export async function getQuizResponses(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);
    const { page, limit } = responsesQuerySchema.parse(req.query);
    const result = await responseService.getQuizResponses({
      id,
      userId: req.user.userId,
      page,
      limit,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }
    return next(error);
  }
}
