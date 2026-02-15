import { api } from "@/services/api";

export const questionService = {
  async listBySubject(subjectId, params = {}) {
    const response = await api.get("/questions", {
      params: { subject_id: subjectId, ...params }
    });
    return response.data;
  },

  async create(payload) {
    const response = await api.post("/questions", payload);
    return response.data;
  },

  async bulkImport(payload) {
    const response = await api.post("/questions/bulk-import", payload);
    return response.data;
  },

  async remove(id) {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  },

  async update(id, payload) {
    const response = await api.put(`/questions/${id}`, payload);
    return response.data;
  }
};
