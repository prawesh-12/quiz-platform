import { createHash } from "crypto";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../config/jwt.js";
import { isTokenRevoked } from "../services/revokedTokens.service.js";

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

    if (await isTokenRevoked(hashToken(token))) {
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
