
const db = require("../config/db");

const COLUMNS = {
  heartRate: "avg_heart_rate",
  oxygenSaturation: "oxygen_saturation",
  bodyTemperature: "body_temperature",
  sleepHours: "sleep_duration"
};

// Return the original MySQL DATETIME without timezone conversion.
const SELECT = `
  SELECT
    id,
    user_id,
    avg_heart_rate,
    oxygen_saturation,
    body_temperature,
    sleep_duration,
    DATE_FORMAT(
      recorded_at,
      '%Y-%m-%dT%H:%i:%s'
    ) AS recorded_at
  FROM generic_health
`;

async function findAllByUser(userId) {
  const [rows] = await db.execute(
    `${SELECT}
     WHERE user_id = ?
     ORDER BY recorded_at DESC, id DESC`,
    [userId]
  );

  return rows;
}

async function findLatestByUser(userId) {
  const [rows] = await db.execute(
    `${SELECT}
     WHERE user_id = ?
     ORDER BY recorded_at DESC, id DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function countByUser(userId) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM generic_health
     WHERE user_id = ?`,
    [userId]
  );

  return Number(rows[0].total);
}

async function findByIdAndUser(id, userId) {
  const [rows] = await db.execute(
    `${SELECT}
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [id, userId]
  );

  return rows[0] || null;
}

async function create(userId, data) {
  const [result] = await db.execute(
    `INSERT INTO generic_health (
      user_id,
      avg_heart_rate,
      oxygen_saturation,
      body_temperature,
      sleep_duration
    ) VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      data.heartRate ?? null,
      data.oxygenSaturation ?? null,
      data.bodyTemperature ?? null,
      data.sleepHours ?? null
    ]
  );

  return result.insertId;
}

async function update(userId, measurementId, data) {
  const fields = Object.entries(COLUMNS).filter(
    ([key]) => data[key] !== undefined
  );

  const setClause = fields
    .map(([, column]) => `${column} = ?`)
    .join(", ");

  const values = fields.map(([key]) => data[key]);

  const [result] = await db.execute(
    `UPDATE generic_health
     SET ${setClause}
     WHERE id = ? AND user_id = ?`,
    [...values, measurementId, userId]
  );

  return result.affectedRows;
}

module.exports = {
  findAllByUser,
  findLatestByUser,
  countByUser,
  findByIdAndUser,
  create,
  update
};
