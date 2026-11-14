
const db = require("../config/db");

const findLatestByUser = async (userId) => {
  const [rows] = await db.execute(
    `SELECT * FROM health_measurements
     WHERE user_id = ?
     ORDER BY recorded_at DESC, id DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

const findAllByUser = async (userId) => {
  const [rows] = await db.execute(
    `SELECT * FROM health_measurements
     WHERE user_id = ?
     ORDER BY recorded_at DESC, id DESC`,
    [userId]
  );

  return rows;
};

const countByUser = async (userId) => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM health_measurements
     WHERE user_id = ?`,
    [userId]
  );

  return rows[0].total;
};

const create = async (userId, data) => {
  const [result] = await db.execute(
    `INSERT INTO health_measurements (
      user_id, heart_rate, systolic_bp, diastolic_bp,
      oxygen_saturation, body_temperature, blood_glucose,
      sleep_hours, mood, body_mass
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.heartRate ?? null,
      data.bloodPressure?.systolic ?? null,
      data.bloodPressure?.diastolic ?? null,
      data.oxygenSaturation ?? null,
      data.bodyTemperature ?? null,
      data.bloodGlucose ?? null,
      data.sleepHours ?? null,
      data.mood ?? null,
      data.bodyMass ?? null
    ]
  );

  return result.insertId;
};

const update = async (userId, measurementId, data) => {
  const fields = {
    heartRate: "heart_rate",
    oxygenSaturation: "oxygen_saturation",
    bodyTemperature: "body_temperature",
    bloodGlucose: "blood_glucose",
    sleepHours: "sleep_hours",
    mood: "mood",
    bodyMass: "body_mass"
  };

  const updates = [];

  for (const [key, column] of Object.entries(fields)) {
    if (data[key] !== undefined) {
      updates.push([column, data[key]]);
    }
  }

  if (data.bloodPressure?.systolic !== undefined) {
    updates.push(["systolic_bp", data.bloodPressure.systolic]);
  }

  if (data.bloodPressure?.diastolic !== undefined) {
    updates.push(["diastolic_bp", data.bloodPressure.diastolic]);
  }

  if (updates.length === 0) return null;

  const setClause = updates
    .map(([column]) => `${column} = ?`)
    .join(", ");

  const [result] = await db.execute(
    `UPDATE health_measurements
     SET ${setClause}
     WHERE id = ? AND user_id = ?`,
    [
      ...updates.map(([, value]) => value),
      measurementId,
      userId
    ]
  );

  return result.affectedRows;
};

const findByIdAndUser = async (measurementId, userId) => {
  const [rows] = await db.execute(
    `SELECT * FROM health_measurements
     WHERE id = ? AND user_id = ?`,
    [measurementId, userId]
  );

  return rows[0] || null;
};

module.exports = {
  findLatestByUser,
  findAllByUser,
  countByUser,
  create,
  update,
  findByIdAndUser
};
