import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/jwt.js";
import { query } from "../config/db.js";

const SALT_ROUNDS = 12;
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const ADMIN_PASSWORD_HASH = String(process.env.ADMIN_PASSWORD_HASH || "");
const ADMIN_NAME = String(process.env.ADMIN_NAME || "Admin").trim();

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(1),
  role: z.enum(["teacher", "admin"]).optional().default("teacher")
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100)
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
      id: user.id,
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

function mapTeacherUser(record) {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    school: record.school ?? null,
    contact_no: record.contact_no ?? null,
    has_avatar: Boolean(record.has_avatar),
    created_at: record.created_at,
    role: "teacher"
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.validatedBody;
    const normalizedEmail = email.toLowerCase();

    const existing = await query("SELECT id FROM teachers WHERE email = $1", [normalizedEmail]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `
      INSERT INTO teachers (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, school, contact_no, has_avatar, created_at
      `,
      [name, normalizedEmail, hashedPassword]
    );

    return res.status(201).json({ user: mapTeacherUser(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password, role } = req.validatedBody;
    const normalizedEmail = email.toLowerCase();

    if (role === "admin") {
      if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
        return res.status(500).json({ error: "Admin authentication is not configured" });
      }

      if (normalizedEmail !== ADMIN_EMAIL) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const passwordMatches = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      if (!passwordMatches) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = {
        id: 0,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        has_avatar: false,
        role: "admin"
      };

      const token = signTeacherToken(user);
      return res.status(200).json({ token, user });
    }

    const result = await query(
      `
      SELECT id, name, email, password, school, contact_no, has_avatar, created_at
      FROM teachers
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userRecord = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, userRecord.password);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = mapTeacherUser(userRecord);

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
      [
        hashToken(token),
        req.user?.role === "teacher" ? Number(req.user.userId ?? req.user.id) : null,
        Number(exp)
      ]
    );

    await query(`DELETE FROM revoked_tokens WHERE expires_at <= NOW()`);

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    if (req.user?.role === "admin") {
      return res.status(200).json({
        user: {
          id: 0,
          name: ADMIN_NAME || req.user?.name || "Admin",
          email: ADMIN_EMAIL || req.user?.email || "",
          has_avatar: false,
          role: "admin"
        }
      });
    }

    const result = await query(
      `
      SELECT id, name, email, school, contact_no, has_avatar, created_at
      FROM teachers
      WHERE id = $1
      `,
      [req.user.userId ?? req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Teacher not found for token" });
    }

    return res.status(200).json({ user: mapTeacherUser(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name } = req.validatedBody;

    const result = await query(
      `
      UPDATE teachers
      SET name = $1
      WHERE id = $2
      RETURNING id, name, email, school, contact_no, has_avatar, created_at
      `,
      [name, req.user.userId ?? req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    return res.status(200).json({ user: mapTeacherUser(result.rows[0]) });
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
      FROM teachers
      WHERE id = $1
      `,
      [req.user.userId ?? req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const userRecord = result.rows[0];
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userRecord.password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const nextPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await query(
      `
      UPDATE teachers
      SET password = $1
      WHERE id = $2
      `,
      [nextPasswordHash, req.user.userId ?? req.user.id]
    );

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return next(error);
  }
}
