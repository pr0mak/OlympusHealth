
const API_URL = "http://localhost:3001";

async function request(endpoint, token) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "API request failed");
  }

  return result.data;
}

export const healthApi = {
  getSummary: (token) =>
    request("/api/health", token),

  getMeasurements: (token) =>
    request("/api/health/measurements", token)
};
