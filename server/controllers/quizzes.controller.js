import { z } from "zod";

import { quizIdParamSchema } from "../validators/quizzes.validator.js";
import * as quizService from "../services/quizzes.service.js";
import { buildQuizResultsBuffer } from "../services/quizExport.service.js";

export async function getQuizLiveStats(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);
    const result = await quizService.getLiveStats({ id, userId: req.user.userId });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }
    return next(error);
  }
}

export async function getQuizLeaderboard(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);
    const result = await quizService.getLeaderboard({ id, userId: req.user.userId });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }
    return next(error);
  }
}

export async function exportQuizResponses(req, res, next) {
  try {
    const { id } = quizIdParamSchema.parse(req.params);
    const { quizId, students } = await quizService.getExportData({ id, userId: req.user.userId });
    const buffer = await buildQuizResultsBuffer(students);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="quiz_${quizId}_results.xlsx"`);
    return res.status(200).send(buffer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid quiz id" });
    }
    return next(error);
  }
}
