
const {
  TABLES,
  getMetricHistory,
  getAllLatest
} = require("../models/HealthTrajectoryModel");

const {
  runHealthMpc,
  runHealthForecast,
  runExerciseImpact
} = require("../services/projectionService");

const ALLOWED_SETTINGS = [
  "planning_days",
  "weekly_budget_minutes",
  "max_minutes_per_day",
  "target_minutes_per_day",
  "resistance_fraction",
  "resistance_intensity",
  "aerobic_intensity",
  "initial_fatigue",
  "fatigue_limit"
];

// Get validated planning settings
function getSettings(body = {}) {
  return Object.fromEntries(
    ALLOWED_SETTINGS
      .filter(key => body[key] !== undefined)
      .map(key => [key, body[key]])
  );
}

// Get latest health measurements from MySQL
async function getMeasurements(userId) {
  const latest = await getAllLatest(userId);
  const measurements = [];

  for (const [table, metrics] of Object.entries(latest || {})) {
    if (!metrics || typeof metrics !== "object") continue;

    for (const [metric, reading] of Object.entries(metrics)) {
      if (
        !reading ||
        typeof reading !== "object" ||
        reading.value === null ||
        reading.value === undefined
      ) {
        continue;
      }

      const value = Number(reading.value);

      if (!Number.isFinite(value)) continue;

      measurements.push({
        metric: `${table}.${metric}`,
        value,
        recorded_at: reading.recordedAt
      });
    }
  }

  return measurements;
}

// GET /api/future-projection/metrics
function getMetrics(req, res) {
  return res.json({
    success: true,
    metrics: TABLES
  });
}

// GET /api/future-projection/history
async function getHistory(req, res, next) {
  try {
    const { table, metric } = req.query;

    if (
      typeof table !== "string" ||
      typeof metric !== "string" ||
      !Object.hasOwn(TABLES, table) ||
      !TABLES[table].includes(metric)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid table or metric"
      });
    }

    const limit = req.query.limit === undefined
      ? 365
      : Number(req.query.limit);

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 2000"
      });
    }

    const history = await getMetricHistory(
      req.user.id,
      table,
      metric,
      limit
    );

    return res.json({
      success: true,
      table,
      metric,
      count: history.length,
      history
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/future-projection/mpc
async function generateMpc(req, res, next) {
  try {
    const userId = req.user.id;

    const measurements = await getMeasurements(userId);
    const settings = getSettings(req.body || {});

    const result = await runHealthMpc({
      ...settings,
      astronaut_id: `user-${userId}`,
      measurements
    });

    return res.json({
      success: true,
      mpc: result
    });
  } catch (error) {
    console.error("[Exercise Planner] Error:", error);
    next(error);
  }
}

// POST /api/future-projection/forecast
async function forecast(req, res, next) {
  try {
    const { table, metric } = req.body || {};
    const days = req.body?.days ?? 7;

    if (
      typeof table !== "string" ||
      typeof metric !== "string" ||
      !Object.hasOwn(TABLES, table) ||
      !TABLES[table].includes(metric) ||
      ![7, 14, 30].includes(days)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid metric or horizon"
      });
    }

    const history = await getMetricHistory(
      req.user.id,
      table,
      metric,
      365
    );

    const result = await runHealthForecast({
      metric: `${table}.${metric}`,
      days,
      history
    });

    return res.json({
      success: true,
      table,
      metric,
      forecast: result
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/future-projection/exercise-impact
async function generateExerciseImpact(req, res, next) {
  try {
    const userId = req.user.id;

    const measurements = await getMeasurements(userId);
    const settings = getSettings(req.body || {});

    const result = await runExerciseImpact({
      ...settings,
      astronaut_id: `user-${userId}`,
      measurements
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("[Exercise Impact] Error:", error);
    next(error);
  }
}

module.exports = {
  getMetrics,
  getHistory,
  generateMpc,
  forecast,
  generateExerciseImpact
};
