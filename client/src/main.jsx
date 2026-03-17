import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";
import BackendWarmupGate from "@/components/shared/BackendWarmupGate";
import { AuthProvider } from "@/context/AuthContext";
import { applyThemeVariables } from "@/lib/applyThemeVariables";
import "./index.css";

const queryClient = new QueryClient();
applyThemeVariables();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BackendWarmupGate>
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </BackendWarmupGate>
    </QueryClientProvider>
  </React.StrictMode>
);
