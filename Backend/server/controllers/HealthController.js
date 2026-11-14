
const HealthModel = require("../models/HealthModel");

const RANGES = {
  heartRate: [1, 300],
  oxygenSaturation: [0, 100],
  bodyTemperature: [20, 45],
  sleepHours: [0, 24]
};

function validateMeasurement(data) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return "Invalid JSON body";
  }

  const keys = Object.keys(data);

  if (!keys.length) {
    return "At least one measurement is required";
  }

  for (const key of keys) {
    if (!Object.hasOwn(RANGES, key)) {
      return `Unknown field: ${key}`;
    }

    const [min, max] = RANGES[key];
    const value = data[key];

    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < min ||
      value > max ||
      (
        key === "heartRate" &&
        !Number.isInteger(value)
      )
    ) {
      return `Invalid ${key}`;
    }
  }

  return null;
}

function format(row) {
  if (!row) return null;

  return {
    id: row.id,
    heartRate:
      row.avg_heart_rate === null
        ? null
        : Number(row.avg_heart_rate),

    oxygenSaturation:
      row.oxygen_saturation === null
        ? null
        : Number(row.oxygen_saturation),

    bodyTemperature:
      row.body_temperature === null
        ? null
        : Number(row.body_temperature),

    sleepHours:
      row.sleep_duration === null
        ? null
        : Number(row.sleep_duration),

    recordedAt: row.recorded_at
  };
}

// GET /api/health
async function getHealth(req, res, next) {
  try {
    const userId = req.user.id;

    const [latest, total] = await Promise.all([
      HealthModel.findLatestByUser(userId),
      HealthModel.countByUser(userId)
    ]);

    return res.json({
      success: true,
      data: {
        latestMeasurement: format(latest),
        totalMeasurements: total,
        healthStatus: "not_assessed"
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/health/measurements
async function getMeasurements(req, res, next) {
  try {
    const rows = await HealthModel.findAllByUser(
      req.user.id
    );

    return res.json({
      success: true,
      count: rows.length,
      data: rows.map(format)
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/health/measurements
async function createMeasurement(req, res, next) {
  try {
    const issue = validateMeasurement(req.body);

    if (issue) {
      return res.status(400).json({
        success: false,
        message: issue
      });
    }

    const id = await HealthModel.create(
      req.user.id,
      req.body
    );

    const row = await HealthModel.findByIdAndUser(
      id,
      req.user.id
    );

    return res.status(201).json({
      success: true,
      data: format(row)
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/health/measurements
async function updateMeasurement(req, res, next) {
  try {
    const { measurementId, ...data } = req.body || {};

    if (
      !Number.isSafeInteger(measurementId) ||
      measurementId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid measurementId required"
      });
    }

    const issue = validateMeasurement(data);

    if (issue) {
      return res.status(400).json({
        success: false,
        message: issue
      });
    }

    const affected = await HealthModel.update(
      req.user.id,
      measurementId,
      data
    );

    if (!affected) {
      return res.status(404).json({
        success: false,
        message: "Measurement not found"
      });
    }

    const row = await HealthModel.findByIdAndUser(
      measurementId,
      req.user.id
    );

    return res.json({
      success: true,
      data: format(row)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHealth,
  getMeasurements,
  createMeasurement,
  updateMeasurement
};
