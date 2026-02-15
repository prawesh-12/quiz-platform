import { api } from "@/services/api";

export const violationService = {
  async report(payload, sessionToken) {
    const response = await api.post("/violations", payload, {
      headers: {
        "X-Session-Token": sessionToken
      }
    });

    return response.data;
  },

  async getBySession(sessionId) {
    const response = await api.get("/violations", {
      params: {
        session_id: sessionId
      }
    });

    return response.data;
  }
};
