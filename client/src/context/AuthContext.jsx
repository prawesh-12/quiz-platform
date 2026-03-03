import { createContext, useEffect, useMemo, useReducer } from "react";

import { authService } from "@/services/authService";

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

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let ignore = false;

    async function hydrateAuth() {
      dispatch({ type: "HYDRATE_START" });

      const token = localStorage.getItem("quiz_token");
      if (!token) {
        if (!ignore) {
          dispatch({ type: "HYDRATE_FAIL" });
        }
        return;
      }

      try {
        const data = await authService.me();

        if (!ignore) {
          dispatch({ type: "HYDRATE_SUCCESS", payload: { token, user: data.user } });
        }
      } catch {
        localStorage.removeItem("quiz_token");
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
        localStorage.setItem("quiz_token", token);
        dispatch({ type: "LOGIN_SUCCESS", payload: { token, user } });
      },
      logout: async () => {
        try {
          if (state.token) {
            await authService.logout();
          }
        } catch {
          // Best-effort server logout. Always clear local auth state.
        } finally {
          localStorage.removeItem("quiz_token");
          dispatch({ type: "LOGOUT" });
        }
      },
      setUser: (user) => {
        dispatch({ type: "UPDATE_USER", payload: user });
      }
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
