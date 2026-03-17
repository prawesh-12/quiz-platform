import { createContext, useEffect, useMemo, useReducer } from "react";

import { authService } from "@/services/authService";
import { getTokenKey, getUserKey } from "@/services/api";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true
};

function authReducer(state, action) {
  switch (action.type) {
    case "HYDRATE_START":
      return {
        ...state,
        isLoading: true
      };
    case "HYDRATE_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload
      };
    case "LOGOUT":
      return {
        ...initialState,
        isLoading: false
      };
    case "HYDRATE_FAIL":
      return {
        ...initialState,
        isLoading: false
      };
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
  const rawUser = localStorage.getItem(getUserKey());
  if (!rawUser) {
    return null;
  }

  try {
    return normalizeUser(JSON.parse(rawUser));
  } catch {
    localStorage.removeItem(getUserKey());
    return null;
  }
}

function persistAuth(token, user, role) {
  const tokenKey = getTokenKey(role);
  const userKey = getUserKey(role);

  if (token) {
    localStorage.setItem(tokenKey, token);
  } else {
    localStorage.removeItem(tokenKey);
  }

  if (user) {
    localStorage.setItem(userKey, JSON.stringify(user));
  } else {
    localStorage.removeItem(userKey);
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let ignore = false;

    async function hydrateAuth() {
      dispatch({ type: "HYDRATE_START" });

      const token = localStorage.getItem(getTokenKey());
      const storedUser = loadStoredUser();
      if (!token) {
        if (!ignore) {
          dispatch({ type: "HYDRATE_FAIL" });
        }
        return;
      }

      try {
        const data = await authService.me();
        const normalizedUser = normalizeUser(data?.user) || storedUser;

        if (!normalizedUser) {
          throw new Error("User payload missing");
        }

        persistAuth(token, normalizedUser, normalizedUser.role);

        if (!ignore) {
          dispatch({ type: "HYDRATE_SUCCESS", payload: { token, user: normalizedUser } });
        }
      } catch {
        persistAuth(null, null);
        if (!ignore) {
          dispatch({ type: "HYDRATE_FAIL" });
        }
      }
    }

    hydrateAuth();

    return () => {
      ignore = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login: ({ token, user }) => {
        const normalizedUser = normalizeUser(user);
        persistAuth(token, normalizedUser, normalizedUser?.role);
        dispatch({ type: "LOGIN_SUCCESS", payload: { token, user: normalizedUser } });
      },
      logout: async () => {
        const role = state.user?.role;
        try {
          if (state.token) {
            await authService.logout();
          }
        } catch {
          // Best-effort server logout. Always clear local auth state.
        } finally {
          persistAuth(null, null, role);
          dispatch({ type: "LOGOUT" });
        }
      },
      setUser: (user) => {
        const normalizedUser = normalizeUser({
          ...(state.user || {}),
          ...(user || {})
        });
        persistAuth(state.token, normalizedUser, normalizedUser?.role);
        dispatch({ type: "UPDATE_USER", payload: normalizedUser });
      }
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
