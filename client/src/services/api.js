import axios from "axios";

import { pushToast } from "@/hooks/useToast";
import { API_BASE_URL } from "@/lib/apiBaseUrl";

/**
 * Determine which role's token to use based on the current browser URL.
 * Admin pages live under /admin/*, everything else uses the teacher token.
 */
function getActiveRole() {
  return window.location.pathname.startsWith("/admin") ? "admin" : "teacher";
}

export function getTokenKey(role) {
  return `quiz_token_${role || getActiveRole()}`;
}

export function getUserKey(role) {
  return `quiz_user_${role || getActiveRole()}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(getTokenKey());

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // Auto-logout only on 401 (invalid/expired token)
    // 403 means valid token but wrong role — don't clear the session
    if (status === 401) {
      const role = getActiveRole();
      const tokenKey = getTokenKey(role);
      const hadToken = Boolean(localStorage.getItem(tokenKey));
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(getUserKey(role));
      if (hadToken && !window.__quizLogoutRedirecting) {
        window.__quizLogoutRedirecting = true;
        window.location.replace("/login");
      }
      return Promise.reject(error);
    }

    if (!error?.config?.skipErrorToast) {
      pushToast({
        title: "Something went wrong",
        description: error?.response?.data?.error || "Please try again.",
        variant: "destructive"
      });
    }

    return Promise.reject(error);
  }
);
