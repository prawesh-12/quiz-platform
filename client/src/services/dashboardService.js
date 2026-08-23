import { api } from "@/services/api";

// Server-side aggregates, so the browser stops fetching every quiz and response page to roll up.
export const dashboardService = {
  async getSummary(scope = "teachers") {
    const response = await api.get(`/${scope}/dashboard/summary`);
    return response.data;
  },

  async getTrend(scope = "teachers", { start, end } = {}) {
    const response = await api.get(`/${scope}/dashboard/trend`, {
      params: { start, end }
    });
    return response.data;
  }
};
