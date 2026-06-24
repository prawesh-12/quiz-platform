import { Router } from "express";

import {
  deleteUnit,
  getUnitQuestions,
  updateUnit,
} from "../controllers/units.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const unitsRouter = Router();

unitsRouter.use(authenticate);

unitsRouter.put("/:id", authorize("teacher", "admin"), updateUnit);
unitsRouter.delete("/:id", authorize("teacher", "admin"), deleteUnit);
unitsRouter.get("/:id/questions", authorize("teacher", "admin"), getUnitQuestions);

export default unitsRouter;
