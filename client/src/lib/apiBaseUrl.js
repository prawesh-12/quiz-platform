const rawApiBaseUrl = String(import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

export const API_BASE_URL = rawApiBaseUrl
  ? /\/api$/i.test(rawApiBaseUrl)
    ? rawApiBaseUrl
    : `${rawApiBaseUrl}/api`
  : "/api";

export const HEALTHCHECK_URL = `${API_BASE_URL}/health`;

// Services the SPA depends on; warmup waits for every one to report ready, so the app never
// renders against a half-cold backend (e.g. auth/questionbank/analytics still starting).
export const REQUIRED_SERVICES = ["auth", "questionbank", "quiz", "analytics", "exam"];

export const READINESS_URLS = REQUIRED_SERVICES.map(
  (service) => `${API_BASE_URL}/${service}/ready`
);
