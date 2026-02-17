import { Router } from "express";

import { deleteUnit, getUnitQuestions, updateUnit } from "../controllers/units.controller.js";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

const unitsRouter = Router();

unitsRouter.use(authenticate, authorize("teacher"));

unitsRouter.put("/:id", updateUnit);
unitsRouter.delete("/:id", deleteUnit);
unitsRouter.get("/:id/questions", getUnitQuestions);

export default unitsRouter;
