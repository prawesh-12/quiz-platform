import { createContext, useEffect, useMemo, useReducer } from "react";

import { authService } from "@/services/authService";
import { USER_STORAGE_KEY } from "@/services/api";

const LOGGED_OUT_STATE = {
  user: null,
  isAuthenticated: false,
  isLoading: false
};

function authReducer(state, action) {
  switch (action.type) {
    case "HYDRATE_SUCCESS":
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload
      };
    case "LOGOUT":
    case "HYDRATE_FAIL":
      return { ...LOGGED_OUT_STATE };
    default:
      return state;
  }
}

export const AuthContext = createContext(null);

function normalizeUser(user) {
  if (!user || typeof user !== "object") {
    return null;
  }

  return {
    ...user,
    role: user.role || null,
    has_avatar: Boolean(user.has_avatar)
  };
}

function loadStoredUser() {
  const rawUser = localStorage.getItem(USER_STORAGE_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return normalizeUser(JSON.parse(rawUser));
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

function persistUser(user) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

const MAX_HYDRATE_ATTEMPTS = 5;
const BASE_RETRY_MS = 1000;
const MAX_RETRY_MS = 8000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(attempt) {
  return Math.min(MAX_RETRY_MS, BASE_RETRY_MS * 2 ** attempt);
}

// A 401 is the only definite logged-out signal; network and 5xx are retried with backoff.
async function fetchCurrentUser(shouldStop) {
  for (let attempt = 0; attempt < MAX_HYDRATE_ATTEMPTS; attempt += 1) {
    if (shouldStop()) {
      return { status: "aborted" };
    }
    try {
      const data = await authService.me({ skipErrorToast: true });
      return { status: "ok", user: normalizeUser(data?.user) };
    } catch (error) {
      if (error?.response?.status === 401) {
        return { status: "unauthorized" };
      }
      await sleep(retryDelay(attempt));
    }
  }
  return { status: "transient" };
}

// Trust the stored user immediately so no screen blocks on /auth/me; a 401 still clears it below.
function createInitialState() {
  const storedUser = loadStoredUser();
  return {
    user: storedUser,
    isAuthenticated: Boolean(storedUser),
    isLoading: false
  };
}

// Verifies the stored user in the background; a definite 401 is the only thing that clears it.
function useBackgroundHydration(dispatch) {
  useEffect(() => {
    let ignore = false;

    async function hydrateAuth() {
      const storedUser = loadStoredUser();
      if (!storedUser) {
        if (!ignore) dispatch({ type: "HYDRATE_FAIL" });
        return;
      }

      const result = await fetchCurrentUser(() => ignore);
      if (ignore || result.status === "aborted") return;

      if (result.status === "unauthorized") {
        persistUser(null);
        dispatch({ type: "HYDRATE_FAIL" });
        return;
      }

      // A transient blip keeps the stored user; the API interceptor still forces logout on a real 401.
      const nextUser = result.status === "ok" && result.user ? result.user : storedUser;
      persistUser(nextUser);
      dispatch({ type: "HYDRATE_SUCCESS", payload: { user: nextUser } });
    }

    hydrateAuth();

    return () => {
      ignore = true;
    };
  }, [dispatch]);
}

function buildAuthActions(dispatch, currentUser) {
  return {
    login: ({ user }) => {
      const normalizedUser = normalizeUser(user);
      persistUser(normalizedUser);
      dispatch({ type: "LOGIN_SUCCESS", payload: { user: normalizedUser } });
    },
    logout: async () => {
      try {
        await authService.logout();
      } catch {
        // Best-effort server logout. Always clear local auth state.
      } finally {
        persistUser(null);
        dispatch({ type: "LOGOUT" });
      }
    },
    setUser: (user) => {
      const normalizedUser = normalizeUser({ ...(currentUser || {}), ...(user || {}) });
      persistUser(normalizedUser);
      dispatch({ type: "UPDATE_USER", payload: normalizedUser });
    }
  };
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, undefined, createInitialState);
  useBackgroundHydration(dispatch);

  const value = useMemo(() => ({ ...state, ...buildAuthActions(dispatch, state.user) }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
