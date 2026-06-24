import { api } from "@/services/api";

export const sessionService = {
  async enter(payload) {
    const response = await api.post("/sessions/enter", payload);
    return response.data;
  },

  async getTiming(sessionToken) {
    const response = await api.get("/sessions/timing", {
      headers: {
        "X-Session-Token": sessionToken
      }
    });

    return response.data;
  },

  async getResult(sessionToken) {
    const response = await api.get("/sessions/result", {
      headers: {
        "X-Session-Token": sessionToken
      }
    });

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
    const response = await api.patch("/sessions/progress", payload, {
      headers: {
        "X-Session-Token": sessionToken
      }
    });

    return response.data;
  },

  async saveAnswer(questionId, payload, sessionToken) {
    const response = await api.patch(`/sessions/answers/${questionId}`, payload, {
      headers: {
        "X-Session-Token": sessionToken
      }
    });

    return response.data;
  }
};
