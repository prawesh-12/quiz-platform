import { api } from "@/services/api";

export const unitService = {
  listBySubject: async (subjectId) => {
    const response = await api.get(`/subjects/${subjectId}/units`);
    return response.data;
  },

  create: async (subjectId, payload) => {
    const response = await api.post(`/subjects/${subjectId}/units`, payload);
    return response.data;
  },

  update: async (unitId, payload) => {
    const response = await api.put(`/units/${unitId}`, payload);
    return response.data;
  },

  delete: async (unitId) => {
    const response = await api.delete(`/units/${unitId}`);
    return response.data;
  },
  
  getQuestions: async (unitId, params = {}) => {
    const response = await api.get(`/units/${unitId}/questions`, { params });
    return response.data;
  }
};
