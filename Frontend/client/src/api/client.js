
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

// ==========================================
// GENERAL API REQUEST
// ==========================================

export async function apiRequest(path, { token, ...options } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to the Olympus Health backend. Check that Express is running on port 3001."
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      payload?.message ||
      `Request failed (${response.status})`
    );

    error.status = response.status;
    throw error;
  }

  return payload;
}

// ==========================================
// AUTHENTICATION API
// ==========================================

export const authApi = {
  register: (data) =>
    apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: (token) =>
    apiRequest("/api/auth/me", { token }),
};

// ==========================================
// EXISTING SCIENTIFIC PROJECTION API
// ==========================================

export const projectionApi = {
  get: (token, days = 30) =>
    apiRequest(`/api/projection?days=${days}`, {
      token,
    }),

  simulate: (token, data) =>
    apiRequest("/api/projection", {
      token,
      method: "POST",
      body: JSON.stringify(data),
    }),

  catalog: (token) =>
    apiRequest("/api/projection/catalog", {
      token,
    }),
};

// ==========================================
// FUTURE PROJECTION API
// ==========================================

export const futureProjectionApi = {

  // GET: Available health metrics from MySQL
  metrics: (token) =>
    apiRequest("/api/future-projection/metrics", {
      token,
    }),

  // GET: Historical measurements for one metric
  history: (token, table, metric, limit = 365) => {
    const params = new URLSearchParams({
      table,
      metric,
      limit: String(limit),
    });

    return apiRequest(
      `/api/future-projection/history?${params.toString()}`,
      { token }
    );
  },

  // POST: Generate optimized exercise schedule
  mpc: (token, settings = {}) =>
    apiRequest("/api/future-projection/mpc", {
      token,
      method: "POST",
      body: JSON.stringify(settings),
    }),


  // POST: Generate exercise plan and fatigue comparison
  exerciseImpact: (token, settings = {}) =>
    apiRequest("/api/future-projection/exercise-impact", {
      token,
      method: "POST",
      body: JSON.stringify(settings),
    }),


  
  // POST: Generate future health trajectory
  forecast: (token, table, metric, days = 7) =>
    apiRequest("/api/future-projection/forecast", {
      token,
      method: "POST",
      body: JSON.stringify({
        table,
        metric,
        days,
      }),
    }),
};
