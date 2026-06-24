import * as authService from "../services/auth.service.js";

const OK = 200;

// Profile read on the teachers surface; the authenticated teacher's own record.
export async function getMyProfile(req, res, next) {
  try {
    return res.status(OK).json(await authService.getCurrentUser(req.user));
  } catch (error) {
    return next(error);
  }
}
