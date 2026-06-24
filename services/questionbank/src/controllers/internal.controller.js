import * as internalService from "../services/internal.service.js";

export async function selectQuestions(req, res, next) {
  try {
    const { subjectId, unitSelections } = req.validatedBody;
    const result = await internalService.selectBankQuestions({ subjectId, unitSelections });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
