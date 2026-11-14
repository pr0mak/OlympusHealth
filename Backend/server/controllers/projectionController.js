const { runProjection, getCatalog } = require('../services/projectionService');

const ENVIRONMENTS = new Set(['LEO', 'LUNAR_ORBIT', 'LUNAR_SURFACE', 'MARS_TRANSIT', 'MARS_SURFACE']);
const INTENSITIES = new Set(['low', 'moderate', 'high']);
const QUALITY_METRICS = new Set(['failure_load','total_vbmd','trabecular_vbmd','trabecular_volume_fraction','trabecular_thickness','cortical_vbmd','cortical_thickness','cortical_porosity']);
const METABOLISM_METRICS = new Set(['ctx_urinary','ntx_urinary','osteocalcin','sclerostin']);

function invalidInput(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}
function finiteBetween(v, min, max, name) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) invalidInput(`Invalid ${name}`);
  return v;
}
function integerBetween(v, min, max, name) {
  if (!Number.isInteger(v)) invalidInput(`Invalid ${name}`);
  return finiteBetween(v, min, max, name);
}
function createPayload(input, userId) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalidInput('Invalid projection payload');
  const mission = input.mission || {};
  const health = input.health || {};
  const exercise = input.exercise || {};
  if (![mission, health, exercise].every(v => v && typeof v === 'object' && !Array.isArray(v))) invalidInput('Invalid nested projection inputs');
  const durationDays = integerBetween(mission.durationDays ?? 30, 1, 1200, 'mission.durationDays');
  const currentDay = integerBetween(mission.currentDay ?? 0, 0, durationDays, 'mission.currentDay');
  const environment = mission.environment ?? 'LEO';
  if (!ENVIRONMENTS.has(environment)) invalidInput('Invalid mission.environment');
  const initialFemoralNeckBmdGcm2 = health.initialFemoralNeckBmdGcm2 ?? null;
  if (initialFemoralNeckBmdGcm2 !== null) finiteBetween(initialFemoralNeckBmdGcm2, 0.000001, 2.5, 'health.initialFemoralNeckBmdGcm2');
  const resistanceIntensity = exercise.resistanceIntensity ?? 'moderate';
  const aerobicIntensity = exercise.aerobicIntensity ?? 'moderate';
  if (!INTENSITIES.has(resistanceIntensity) || !INTENSITIES.has(aerobicIntensity)) invalidInput('Invalid exercise intensity');
  return {
    // Never accept a user-controlled astronautId: derive it from the verified JWT.
    astronautId: `user-${userId}`,
    mission: { environment, durationDays, currentDay },
    health: { initialFemoralNeckBmdGcm2 },
    exercise: {
      weeklyBudgetMinutes: finiteBetween(exercise.weeklyBudgetMinutes ?? 210, 0, 1260, 'weeklyBudgetMinutes'),
      targetMinutesPerDay: finiteBetween(exercise.targetMinutesPerDay ?? 45, 0, 180, 'targetMinutesPerDay'),
      resistanceFraction: finiteBetween(exercise.resistanceFraction ?? 0.5, 0, 1, 'resistanceFraction'),
      resistanceIntensity,
      aerobicIntensity,
      initialFatigue: finiteBetween(exercise.initialFatigue ?? 20, 0, 100, 'initialFatigue'),
      fatigueCeiling: finiteBetween(exercise.fatigueCeiling ?? 70, 10, 100, 'fatigueCeiling')
    },
    qualityMetricId: (() => { const value = input.qualityMetricId ?? 'failure_load'; if (!QUALITY_METRICS.has(value)) invalidInput('Invalid qualityMetricId'); return value; })(),
    metabolismMetricId: (() => { const value = input.metabolismMetricId ?? 'ctx_urinary'; if (!METABOLISM_METRICS.has(value)) invalidInput('Invalid metabolismMetricId'); return value; })()
  };
}
async function projection(req, res, next) {
  try {
    // GET loads a default reference projection; POST evaluates user-supplied settings.
    const input = req.method === 'GET'
      ? { mission: { durationDays: req.query.days === undefined ? 30 : Number(req.query.days) } }
      : req.body;
    const payload = createPayload(input, req.user.id);
    const result = await runProjection(payload);
    res.json({ success: true, projection: result });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message, ...(error.details ? { details: error.details } : {}) });
    }
    next(error);
  }
}
async function catalog(req, res, next) {
  try { res.json({success: true, catalog: await getCatalog()}); } catch (error) { next(error); }
}
module.exports = { projection, catalog };
