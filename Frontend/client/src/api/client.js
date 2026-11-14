const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

export async function apiRequest(path, { token, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error("Cannot connect to the ASTRA backend. Check that Express is running on port 3001.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const authApi = {
  register: (data) => apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: (token) => apiRequest("/api/auth/me", { token }),
};
