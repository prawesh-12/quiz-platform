import axios from "axios";

import { pushToast } from "@/hooks/useToast";
import { API_BASE_URL } from "@/lib/apiBaseUrl";

export const USER_STORAGE_KEY = "quiz_user";
export const SESSION_EXPIRED_EVENT = "quiz:session-expired";

// withCredentials sends the httpOnly session cookie; the SPA never holds the token itself.
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

let isLoggingOut = false;
let revalidating = null;

function isAuthMeRequest(config) {
  const url = config?.url || "";
  return url === "/auth/me" || url.endsWith("/auth/me");
}

// Announced, not reloaded: a document reload re-runs the warmup gate and refetches the whole app.
function forceLogout() {
  if (isLoggingOut) {
    return;
  }

  const hadSession = Boolean(localStorage.getItem(USER_STORAGE_KEY));
  localStorage.removeItem(USER_STORAGE_KEY);

  if (!hadSession) {
    return;
  }

  isLoggingOut = true;
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

// Re-armed by the app once it has handled the expiry, so a later session can expire too.
export function clearSessionExpiredGuard() {
  isLoggingOut = false;
}

// One shared /auth/me probe per burst of 401s; only a 401 back logs out, 5xx is transient.
function revalidateSession() {
  if (!revalidating) {
    revalidating = api
      .get("/auth/me", { skipErrorToast: true })
      .then(() => true)
      .catch((error) => error?.response?.status !== 401)
      .finally(() => {
        revalidating = null;
      });
  }
  return revalidating;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const config = error?.config;

    // 403 = valid session, wrong role → keep it. Any non-401 → toast and reject.
    if (status !== 401) {
      if (!config?.skipErrorToast) {
        pushToast({
          title: "Something went wrong",
          description: error?.response?.data?.error || "Please try again.",
          variant: "destructive"
        });
      }
      return Promise.reject(error);
    }

    // The revalidation probe must never retry or revalidate itself (would recurse).
    if (isAuthMeRequest(config)) {
      return Promise.reject(error);
    }

    // A slow/flaky 401 must not kill a valid session: retry once, then revalidate.
    if (config && !config.__retried) {
      config.__retried = true;
      return api(config);
    }

    return revalidateSession().then((sessionValid) => {
      if (!sessionValid) {
        forceLogout();
      }
      return Promise.reject(error);
    });
  }
);
