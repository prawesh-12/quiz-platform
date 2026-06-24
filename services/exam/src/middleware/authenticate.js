import { createHash } from "crypto";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../config/jwt.js";
import { isTokenRevoked } from "../services/revokedTokens.service.js";

const SESSION_COOKIE = "quiz_session";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function readToken(req) {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
    if (match) {
      return decodeURIComponent(match.slice(SESSION_COOKIE.length + 1));
    }
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

export default async function authenticate(req, res, next) {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ error: "Missing authentication" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });

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
