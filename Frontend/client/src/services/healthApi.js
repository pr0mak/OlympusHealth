
import { apiRequest } from "../api/client.js";

export const healthApi = {
  getSummary: (token) =>
    apiRequest("/api/health", { token }),

  getMeasurements: (token) =>
    apiRequest("/api/health/measurements", { token }),

  createMeasurement: (token, data) =>
  apiRequest("/api/health/measurements", {
    token,
    method: "POST",
    body: JSON.stringify(data)
  }),

  updateMeasurement: (token, data) =>
  apiRequest("/api/health/measurements", {
    token,
    method: "PUT",
    body: JSON.stringify(data)
  })
};
