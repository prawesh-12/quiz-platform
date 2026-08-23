// Spreads repeated requests so browsers don't align on the same tick.
export function withJitter(baseMs, ratio = 0.2) {
  const safeBase = Number(baseMs) || 0;
  const spread = safeBase * ratio;
  const offset = (Math.random() * 2 - 1) * spread;
  return Math.max(0, Math.round(safeBase + offset));
}

// Exponential backoff with jitter, capped. attempt is 0-based.
export function backoffWithJitter(attempt, { baseMs = 1000, maxMs = 30000, ratio = 0.3 } = {}) {
  const exp = Math.min(maxMs, baseMs * 2 ** attempt);
  const offset = (Math.random() * 2 - 1) * exp * ratio;
  return Math.max(baseMs, Math.round(exp + offset));
}
