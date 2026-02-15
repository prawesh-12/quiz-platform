import { api } from "@/services/api";

export const sessionService = {
  async enter(payload) {
    const response = await api.post("/sessions/enter", payload);
    return response.data;
  },

  async submit(payload, sessionToken) {
    const response = await api.post("/sessions/submit", payload, {
      headers: {
        "X-Session-Token": sessionToken
      }
    });

    return response.data;
  },

  async saveProgress(payload, sessionToken) {
    const response = await api.post("/sessions/progress", payload, {
      headers: {
        "X-Session-Token": sessionToken
      }
    });

    return response.data;
  }
};
