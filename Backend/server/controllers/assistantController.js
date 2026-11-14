const { aiRequest } = require('../services/aiGateway');
const astronautId = (req) => `user-${req.user.id}`;
const bad = (msg) => { const e = new Error(msg); e.status = 400; throw e; };
const number = (v, lo, hi, name, fallback) => {
  const value = v === undefined ? fallback : v;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < lo || value > hi) bad(`Invalid ${name}`);
  return value;
};
const mode = (value) => {
  if (!['demo', 'live'].includes(value)) bad('mode must be demo or live');
  return value;
};
const respond = (res, data) => res.json({success: true, data});
const failure = (res, next, error) => error.status ? res.status(error.status).json({success:false, message:error.message, ...(error.details == null ? {} : {details:error.details})}) : next(error);

async function status(req, res, next) {
  try {
    const m = mode(req.query.mode || 'demo');
    const params = new URLSearchParams({astronautId: astronautId(req), mode: m});
    respond(res, await aiRequest(`/api/v1/ai/status?${params}`));
  } catch (error) { failure(res, next, error); }
}
async function recommend(req, res, next) {
  try {
    const body = req.body || {};
    const ctx = body.context || {};
    const payload = {
      astronautId: astronautId(req), mode: mode(body.mode || 'demo'),
      context: {
        sleepHours: number(ctx.sleepHours, 0, 16, 'sleepHours', 7),
        fatigueBefore: number(ctx.fatigueBefore, 0, 100, 'fatigueBefore', 30),
        availableMinutes: number(ctx.availableMinutes, 0, 180, 'availableMinutes', 60)
      },
      weeklyBudgetMinutes: number(body.weeklyBudgetMinutes, 0, 1260, 'weeklyBudgetMinutes', 280),
      fatigueCeiling: number(body.fatigueCeiling, 10, 100, 'fatigueCeiling', 80)
    };
    if (payload.context.fatigueBefore > payload.fatigueCeiling) bad('Fatigue exceeds ceiling');
    respond(res, await aiRequest('/api/v1/ai/recommend', {method:'POST', payload}));
  } catch (error) { failure(res, next, error); }
}
async function feedback(req, res, next) {
  try {
    const body = req.body || {};
    if (typeof body.recommendationId !== 'string' || !/^[a-f0-9]{32}$/.test(body.recommendationId)) bad('Invalid recommendationId');
    const payload = {
      astronautId: astronautId(req), mode: mode(body.mode || 'demo'),
      recommendationId: body.recommendationId,
      completionPercent: number(body.completionPercent, 0, 100, 'completionPercent'),
      fatigueAfter: number(body.fatigueAfter, 0, 100, 'fatigueAfter')
    };
    respond(res, await aiRequest('/api/v1/ai/feedback', {method:'POST', payload}));
  } catch (error) { failure(res, next, error); }
}
async function demoTrain(req, res, next) {
  try {
    const rounds = req.body?.rounds ?? 30;
    if (!Number.isInteger(rounds) || rounds < 1 || rounds > 100) bad('Invalid rounds');
    respond(res, await aiRequest('/api/v1/ai/demo/train', {method:'POST', payload:{astronautId:astronautId(req), rounds}}));
  } catch (error) { failure(res, next, error); }
}
module.exports = { status, recommend, feedback, demoTrain };
