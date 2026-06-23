import { api } from "@/services/api";

// Server-computed dashboard aggregates. Replaces fetching every quiz + every
// response page and rolling them up in the browser. `scope` is "teachers" or "admin".
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
