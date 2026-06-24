export const COOKIE_NAME = "quiz_session";

const MAX_AGE_MS = Number(process.env.COOKIE_MAX_AGE_MS || 8 * 60 * 60 * 1000);

// Host-only + SameSite=Lax: the SPA reaches the API through its own origin (proxy/rewrite).
function baseOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: process.env.COOKIE_SAMESITE || "lax",
    path: "/"
  };
}

export function setSessionCookie(res, token) {
  if (!token) {
    return;
  }
  res.cookie(COOKIE_NAME, token, { ...baseOptions(), maxAge: MAX_AGE_MS });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, baseOptions());
}
