import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import { applyThemeVariables } from "@/lib/applyThemeVariables";
import "./index.css";

const QUERY_STALE_TIME_MS = 15000;
const MAX_RETRIES = 2;
const FIRST_CLIENT_ERROR = 400;
const FIRST_SERVER_ERROR = 500;

// A 4xx is a settled answer, so retrying only repeats the error toast the interceptor raises.
function retryOnlyServerErrors(failureCount, error) {
  const status = error?.response?.status;
  if (status >= FIRST_CLIENT_ERROR && status < FIRST_SERVER_ERROR) {
    return false;
  }

  return failureCount < MAX_RETRIES;
}

// Cached data renders instantly on remount, so repeat navigation never falls back to a spinner.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME_MS,
      refetchOnWindowFocus: false,
      retry: retryOnlyServerErrors
    }
  }
});
applyThemeVariables();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
