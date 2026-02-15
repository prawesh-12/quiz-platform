import { api } from "@/services/api";

export const responseService = {
  async getQuizResponses(quizId, params = {}) {
    const response = await api.get(`/quizzes/${quizId}/responses`, { params });
    return response.data;
  }
};
