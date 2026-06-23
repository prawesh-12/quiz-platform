import { z } from "zod";

import { subjectIdParamSchema } from "../validators/subjects.validator.js";
import * as subjectService from "../services/subjects.service.js";

function getRequester(req) {
  return { id: req.user.userId ?? req.user.id, role: req.user.role };
}

export async function getQuizHistoryBySubject(req, res, next) {
  try {
    const { id } = subjectIdParamSchema.parse(req.params);
    return res.json(await subjectService.getQuizHistoryBySubject({ id, requester: getRequester(req) }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid subject id" });
    }
    return next(error);
  }
}
