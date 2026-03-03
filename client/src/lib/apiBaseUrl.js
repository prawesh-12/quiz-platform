const rawApiBaseUrl = String(import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

export const API_BASE_URL = rawApiBaseUrl
  ? /\/api$/i.test(rawApiBaseUrl)
    ? rawApiBaseUrl
    : `${rawApiBaseUrl}/api`
  : "/api";

export const HEALTHCHECK_URL = `${API_BASE_URL}/health`;
