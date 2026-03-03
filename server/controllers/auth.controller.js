import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/jwt.js";
import { query } from "../config/db.js";

const SALT_ROUNDS = 12;

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(1)
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  avatar_url: z.string().trim().url().max(500).optional().nullable()
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1),
    new_password: z.string().min(8).max(128),
    confirm_new_password: z.string().min(8).max(128)
  })
  .refine((value) => value.new_password === value.confirm_new_password, {
    message: "New passwords do not match"
  });

function signTeacherToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.validatedBody;
    const normalizedEmail = email.toLowerCase();

    const existing = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, 'teacher')
      RETURNING id, name, email, role, avatar_url, created_at
      `,
      [name, normalizedEmail, hashedPassword]
    );

    return res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.validatedBody;
    const normalizedEmail = email.toLowerCase();

    const result = await query(
      `
      SELECT id, name, email, password, role, avatar_url, created_at
      FROM users
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const userRecord = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, userRecord.password);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      avatar_url: userRecord.avatar_url,
      created_at: userRecord.created_at
    };

    const token = signTeacherToken(user);

    return res.status(200).json({ token, user });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.token;
    const exp = req.user?.exp;

    if (!token || !exp) {
      return res.status(400).json({ error: "Invalid token payload for logout" });
    }

    await query(
      `
      INSERT INTO revoked_tokens (token_hash, user_id, expires_at)
      VALUES ($1, $2, to_timestamp($3))
      ON CONFLICT (token_hash) DO NOTHING
      `,
      [hashToken(token), req.user.userId, Number(exp)]
    );

    await query(`DELETE FROM revoked_tokens WHERE expires_at <= NOW()`);

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    const result = await query(
      `
      SELECT id, name, email, role, avatar_url, created_at
      FROM users
      WHERE id = $1
      `,
      [req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "User not found for token" });
    }

    return res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, avatar_url } = req.validatedBody;

    const result = await query(
      `
      UPDATE users
      SET name = $1, avatar_url = $2
      WHERE id = $3
      RETURNING id, name, email, role, avatar_url, created_at
      `,
      [name, avatar_url || null, req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { current_password: currentPassword, new_password: newPassword } = req.validatedBody;

    const result = await query(
      `
      SELECT id, password
      FROM users
      WHERE id = $1
      `,
      [req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRecord = result.rows[0];
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userRecord.password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const nextPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await query(
      `
      UPDATE users
      SET password = $1
      WHERE id = $2
      `,
      [nextPasswordHash, req.user.userId]
    );

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return next(error);
  }
}
