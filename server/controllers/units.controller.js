import { z } from "zod";

import {
  subjectIdParamSchema,
  unitIdParamSchema,
  unitInputSchema,
} from "../validators/units.validator.js";
import * as unitService from "../services/units.service.js";

function getRequester(req) {
  return {
    id: req.user.userId ?? req.user.id,
    role: req.user.role,
  };
}

export async function listUnitsBySubject(req, res, next) {
  try {
    const { id: subjectId } = subjectIdParamSchema.parse(req.params);
    const result = await unitService.listUnitsBySubject({
      subjectId,
      requester: getRequester(req),
    });
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid subject ID" });
    }
    return next(error);
  }
}

export async function createUnit(req, res, next) {
  try {
    const { id: subjectId } = subjectIdParamSchema.parse(req.params);
    const { name } = unitInputSchema.parse(req.body);
    const result = await unitService.createUnit({
      subjectId,
      name,
      requester: getRequester(req),
    });
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input" });
    }
    return next(error);
  }
}

export async function updateUnit(req, res, next) {
  try {
    const { id } = unitIdParamSchema.parse(req.params);
    const { name } = unitInputSchema.parse(req.body);
    const result = await unitService.updateUnit({ id, name, requester: getRequester(req) });
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input" });
    }
    return next(error);
  }
}

export async function deleteUnit(req, res, next) {
  try {
    const { id } = unitIdParamSchema.parse(req.params);
    const result = await unitService.deleteUnit({ id, requester: getRequester(req) });
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid unit ID" });
    }
    return next(error);
  }
}

export async function getUnitQuestions(req, res, next) {
  try {
    const { id } = unitIdParamSchema.parse(req.params);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await unitService.getUnitQuestions({
      id,
      page,
      limit,
      requester: getRequester(req),
    });
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid unit ID" });
    }
    return next(error);
  }
}
