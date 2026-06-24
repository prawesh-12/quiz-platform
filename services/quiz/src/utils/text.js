// Trim a value to a non-empty string, or null when empty/absent.
export function normalizeNullableText(value) {
  if (value == null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}
