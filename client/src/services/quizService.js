import { api } from "@/services/api";

export const quizService = {
  async list(params = {}) {
    const response = await api.get("/quizzes", { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/quizzes/${id}`);
    return response.data;
  },

  async createManual(payload) {
    const response = await api.post("/quizzes/manual", payload);
    return response.data;
  },

  async autoGenerate(payload) {
    const response = await api.post("/quizzes/auto-generate", payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await api.put(`/quizzes/${id}`, payload);
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await api.put(`/quizzes/${id}/status`, { status });
    return response.data;
  },

  async getLiveStats(id) {
    const response = await api.get(`/quizzes/${id}/live-stats`);
    return response.data;
  },

  async getPreview(id) {
    const response = await api.get(`/quizzes/${id}/preview`);
    return response.data;
  },

  async exportResults(id) {
    const response = await api.get(`/quizzes/${id}/export`, {
      responseType: "blob"
    });
    const contentDisposition = response.headers?.["content-disposition"] || "";
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

    return {
      blob: response.data,
      filename: filenameMatch?.[1] || `quiz_${id}_results.xlsx`
    };
  },

  async duplicate(id) {
    const response = await api.post(`/quizzes/${id}/duplicate`);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/quizzes/${id}`);
    return response.data;
  },

  async getLeaderboard(id) {
    const response = await api.get(`/quizzes/${id}/leaderboard`);
    return response.data;
  }
};
