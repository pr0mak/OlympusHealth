
const HealthModel = require("../models/HealthModel");

const allowedFields = [
  "heartRate",
  "oxygenSaturation",
  "bodyTemperature",
  "bloodGlucose",
  "sleepHours",
  "mood",
  "bodyMass"
];

const ranges = {
  heartRate: [1, 300],
  oxygenSaturation: [0, 100],
  bodyTemperature: [20, 45],
  bloodGlucose: [1, 1000],
  sleepHours: [0, 24],
  mood: [1, 5],
  bodyMass: [1, 500],
  systolic: [1, 300],
  diastolic: [1, 250]
};

function validateMeasurement(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Invalid request body";
  }

  const allowed = [...allowedFields, "bloodPressure"];

  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) {
      return `Unknown field: ${key}`;
    }
  }

  let count = 0;

  for (const field of allowedFields) {
    if (body[field] === undefined) continue;

    count++;
    const value = body[field];
    const [min, max] = ranges[field];

    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < min ||
      value > max ||
      (["heartRate", "mood"].includes(field) &&
        !Number.isInteger(value))
    ) {
      return `Invalid ${field}`;
    }
  }

  if (body.bloodPressure !== undefined) {
    const bp = body.bloodPressure;

    if (!bp || typeof bp !== "object" || Array.isArray(bp)) {
      return "Invalid bloodPressure";
    }

    for (const key of Object.keys(bp)) {
      if (!["systolic", "diastolic"].includes(key)) {
        return `Unknown bloodPressure field: ${key}`;
      }

      const value = bp[key];
      const [min, max] = ranges[key];

      if (
        !Number.isInteger(value) ||
        value < min ||
        value > max
      ) {
        return `Invalid bloodPressure.${key}`;
      }

      count++;
    }
  }

  if (count === 0) return "At least one measurement is required";

  return null;
}

function formatMeasurement(row) {
  if (!row) return null;

  return {
    id: row.id,
    heartRate: row.heart_rate,
    bloodPressure: {
      systolic: row.systolic_bp,
      diastolic: row.diastolic_bp
    },
    oxygenSaturation: row.oxygen_saturation,
    bodyTemperature: row.body_temperature,
    bloodGlucose: row.blood_glucose,
    sleepHours: row.sleep_hours,
    mood: row.mood,
    bodyMass: row.body_mass,
    recordedAt: row.recorded_at
  };
}

const getHealth = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [latest, total] = await Promise.all([
      HealthModel.findLatestByUser(userId),
      HealthModel.countByUser(userId)
    ]);

    res.json({
      success: true,
      data: {
        latestMeasurement: formatMeasurement(latest),
        totalMeasurements: total,
        healthStatus: "not_assessed"
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMeasurements = async (req, res, next) => {
  try {
    const rows = await HealthModel.findAllByUser(req.user.id);

    res.json({
      success: true,
      count: rows.length,
      data: rows.map(formatMeasurement)
    });
  } catch (error) {
    next(error);
  }
};

const createMeasurement = async (req, res, next) => {
  try {
    const validationError = validateMeasurement(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const id = await HealthModel.create(req.user.id, req.body);

    const row = await HealthModel.findByIdAndUser(
      id,
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: "Measurement created",
      data: formatMeasurement(row)
    });
  } catch (error) {
    next(error);
  }
};

const updateMeasurement = async (req, res, next) => {
  try {
    const { measurementId, ...data } = req.body;

    if (!Number.isSafeInteger(measurementId) ||
        measurementId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid measurementId is required"
      });
    }

    const validationError = validateMeasurement(data);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
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

    res.json({
      success: true,
      message: "Measurement updated",
      data: formatMeasurement(row)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
  getMeasurements,
  createMeasurement,
  updateMeasurement
};
