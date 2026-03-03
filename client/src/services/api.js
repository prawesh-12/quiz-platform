import axios from "axios";

import { pushToast } from "@/hooks/useToast";
import { API_BASE_URL } from "@/lib/apiBaseUrl";

export const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("quiz_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
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
