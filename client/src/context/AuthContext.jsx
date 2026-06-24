import { createContext, useEffect, useMemo, useReducer } from "react";

import { authService } from "@/services/authService";
import { USER_STORAGE_KEY } from "@/services/api";

const initialState = {
  user: null,
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

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let ignore = false;

    async function hydrateAuth() {
      dispatch({ type: "HYDRATE_START" });

      if (!loadStoredUser()) {
        if (!ignore) {
          dispatch({ type: "HYDRATE_FAIL" });
        }
        return;
      }

      try {
        const data = await authService.me();
        const normalizedUser = normalizeUser(data?.user);

        if (!normalizedUser) {
          throw new Error("User payload missing");
        }

        persistUser(normalizedUser);

        if (!ignore) {
          dispatch({ type: "HYDRATE_SUCCESS", payload: { user: normalizedUser } });
        }
      } catch {
        persistUser(null);
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
        const normalizedUser = normalizeUser({
          ...(state.user || {}),
          ...(user || {})
        });
        persistUser(normalizedUser);
        dispatch({ type: "UPDATE_USER", payload: normalizedUser });
      }
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
