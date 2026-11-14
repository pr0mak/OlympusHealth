const BASE = (process.env.AI_ENGINE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const TIMEOUT = Number(process.env.ASTRA_AI_TIMEOUT_MS || 20000);
async function aiRequest(path, { method = 'GET', payload } = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      signal: AbortSignal.timeout(TIMEOUT)
    });
  } catch (cause) {
    const timedOut = ['TimeoutError', 'AbortError'].includes(cause.name);
    const error = new Error(timedOut ? 'Python AI Engine timed out' : 'Python AI Engine is unavailable');
    error.status = timedOut ? 504 : 502;
    throw error;
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error('Python AI Engine rejected the request');
    error.status = [400, 404, 422].includes(response.status) ? response.status : 502;
    error.details = data?.detail ?? null;
    throw error;
  }
  return data;
}
module.exports = { aiRequest };
