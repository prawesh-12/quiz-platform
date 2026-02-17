import { api } from "@/services/api";

export const subjectService = {
  async list() {
    const response = await api.get("/subjects");
    return response.data;
  },

  async create(payload) {
    const response = await api.post("/subjects", payload);
    return response.data;
  },

  async remove(id) {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  },

  async getQuizHistory(id) {
    const response = await api.get(`/subjects/${id}/quiz-history`);
    return response.data;
  }
};
