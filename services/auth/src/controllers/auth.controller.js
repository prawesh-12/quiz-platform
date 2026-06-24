import * as authService from "../services/auth.service.js";
import { setSessionCookie, clearSessionCookie } from "../config/cookie.js";

const CREATED = 201;
const OK = 200;

function teacherId(req) {
  return req.user.userId ?? req.user.id;
}

export async function register(req, res, next) {
  try {
    return res.status(CREATED).json(await authService.register(req.validatedBody));
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { token, user } = await authService.login(req.validatedBody);
    setSessionCookie(res, token);
    return res.status(OK).json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const result = await authService.logout({
      token: req.token,
      exp: req.user?.exp,
      role: req.user?.role,
      userId: req.user?.userId ?? req.user?.id,
    });
    clearSessionCookie(res);
    return res.status(OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    return res.status(OK).json(await authService.getCurrentUser(req.user));
  } catch (error) {
    return next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const result = await authService.updateProfile({
      userId: teacherId(req),
      name: req.validatedBody.name,
    });
    return res.status(OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword({
      userId: teacherId(req),
      currentPassword: req.validatedBody.current_password,
      newPassword: req.validatedBody.new_password,
    });
    return res.status(OK).json(result);
  } catch (error) {
    return next(error);
  }
}
