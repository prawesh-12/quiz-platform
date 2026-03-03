import { createHash } from "crypto";
import jwt from "jsonwebtoken";

import { query } from "../config/db.js";
import { JWT_SECRET } from "../config/jwt.js";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export default async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const revokedTokenResult = await query(
      `
      SELECT 1
      FROM revoked_tokens
      WHERE token_hash = $1 AND expires_at > NOW()
      LIMIT 1
      `,
      [hashToken(token)]
    );

    if (revokedTokenResult.rowCount > 0) {
      return res.status(401).json({ error: "Token has been revoked" });
    }

    req.user = payload;
    req.token = token;
    return next();
  } catch (error) {
    if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    return next(error);
  }
}
