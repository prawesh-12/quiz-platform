import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";

import pool from "../config/db.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/jwt.js";
import { AppError } from "../utils/AppError.js";
import * as authRepo from "../repositories/auth.repository.js";
import { invalidateRevokedToken } from "./revokedTokens.service.js";

const SALT_ROUNDS = 12;
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const ADMIN_PASSWORD_HASH = String(process.env.ADMIN_PASSWORD_HASH || "");
const ADMIN_NAME = String(process.env.ADMIN_NAME || "Admin").trim();

function signTeacherToken(user) {
  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function mapTeacherUser(record) {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    school: record.school ?? null,
    contact_no: record.contact_no ?? null,
    has_avatar: Boolean(record.has_avatar),
    created_at: record.created_at,
    role: "teacher",
  };
}

export async function register({ name, email, password }) {
  const normalizedEmail = email.toLowerCase();

  if (await authRepo.findTeacherIdByEmail(pool, normalizedEmail)) {
    throw new AppError(409, "Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const teacher = await authRepo.insertTeacher(pool, { name, email: normalizedEmail, hashedPassword });
  return { user: mapTeacherUser(teacher) };
}

export async function login({ email, password, role }) {
  const normalizedEmail = email.toLowerCase();

  if (role === "admin") {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
      throw new AppError(500, "Admin authentication is not configured");
    }
    if (normalizedEmail !== ADMIN_EMAIL || !(await bcrypt.compare(password, ADMIN_PASSWORD_HASH))) {
      throw new AppError(401, "Invalid credentials");
    }

    const user = { id: 0, name: ADMIN_NAME, email: ADMIN_EMAIL, has_avatar: false, role: "admin" };
    return { token: signTeacherToken(user), user };
  }

  const record = await authRepo.findTeacherByEmail(pool, normalizedEmail);
  if (!record || !(await bcrypt.compare(password, record.password))) {
    throw new AppError(401, "Invalid credentials");
  }

  const user = mapTeacherUser(record);
  return { token: signTeacherToken(user), user };
}

export async function logout({ token, exp, role, userId }) {
  if (!token || !exp) {
    throw new AppError(400, "Invalid token payload for logout");
  }

  const tokenHash = hashToken(token);
  await authRepo.insertRevokedToken(
    pool,
    tokenHash,
    role === "teacher" ? Number(userId) : null,
    Number(exp),
  );
  // Drop any cached "not revoked" result so the revocation takes effect at once.
  await invalidateRevokedToken(tokenHash);
  await authRepo.deleteExpiredRevokedTokens(pool);

  return { message: "Logged out successfully" };
}

export async function getCurrentUser(authUser) {
  if (authUser?.role === "admin") {
    return {
      user: {
        id: 0,
        name: ADMIN_NAME || authUser?.name || "Admin",
        email: ADMIN_EMAIL || authUser?.email || "",
        has_avatar: false,
        role: "admin",
      },
    };
  }

  const record = await authRepo.findTeacherById(pool, authUser.userId ?? authUser.id);
  if (!record) {
    throw new AppError(401, "Teacher not found for token");
  }

  return { user: mapTeacherUser(record) };
}

export async function updateProfile({ userId, name }) {
  const record = await authRepo.updateTeacherName(pool, userId, name);
  if (!record) {
    throw new AppError(404, "Teacher not found");
  }

  return { user: mapTeacherUser(record) };
}

export async function changePassword({ userId, currentPassword, newPassword }) {
  const record = await authRepo.findTeacherPasswordById(pool, userId);
  if (!record) {
    throw new AppError(404, "Teacher not found");
  }

  if (!(await bcrypt.compare(currentPassword, record.password))) {
    throw new AppError(400, "Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await authRepo.updateTeacherPassword(pool, userId, passwordHash);

  return { message: "Password updated successfully" };
}
