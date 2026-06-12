// Parse a positive-integer environment variable, falling back when unset or invalid.
export function readPositiveIntegerEnv(name, fallback) {
  const rawValue = process.env[name];

  if (rawValue == null || rawValue === "") {
    return fallback;
  }

  const value = Number(rawValue);
  if (Number.isInteger(value) && value > 0) {
    return value;
  }

  console.warn(`Invalid ${name} value "${rawValue}". Falling back to ${fallback}.`);
  return fallback;
}
