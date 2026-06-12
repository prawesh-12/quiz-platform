import { z } from "zod";

import { subjectIdParamSchema } from "../validators/subjects.validator.js";
import * as subjectService from "../services/subjects.service.js";

function getRequester(req) {
  return { id: req.user.userId ?? req.user.id, role: req.user.role };
}

export async function listSubjects(req, res, next) {
  try {
    return res.status(200).json(await subjectService.listSubjects(getRequester(req)));
  } catch (error) {
    return next(error);
  }
}

export async function createSubject(req, res, next) {
  try {
    const result = await subjectService.createSubject({
      name: req.validatedBody.name,
      requester: getRequester(req),
    });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteSubject(req, res, next) {
  try {
    const { id } = subjectIdParamSchema.parse(req.params);
    return res.status(200).json(await subjectService.deleteSubject({ id, requester: getRequester(req) }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid subject id" });
    }
    return next(error);
  }
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
