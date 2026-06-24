const FORBIDDEN_STATUS = 403;

// Guards internal-only endpoints: rejects unless X-Internal-Key matches INTERNAL_KEY.
// Nginx strips this header from external requests, so only trusted callers can set it.
export default function internalKey(req, res, next) {
  const expected = process.env.INTERNAL_KEY;
  const provided = req.headers["x-internal-key"];

  if (!expected || provided !== expected) {
    return res.status(FORBIDDEN_STATUS).json({ error: "Forbidden" });
  }

  return next();
}
