import { api } from "@/services/api";

export const authService = {
  async register(payload) {
    const response = await api.post("/auth/register", payload);
    return response.data;
  },

  async login(payload) {
    const response = await api.post("/auth/login", payload);
    return response.data;
  },

  async logout() {
    const response = await api.post("/auth/logout", null, {
      skipErrorToast: true
    });
    return response.data;
  },

  async me() {
    const response = await api.get("/auth/me");
    return response.data;
  },

  async updateProfile(payload) {
    const response = await api.put("/auth/profile", payload);
    return response.data;
  },

  async changePassword(payload) {
    const response = await api.put("/auth/change-password", payload);
    return response.data;
  }
};
