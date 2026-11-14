
const db = require("../config/db");

const TABLES = {
  generic_health: [
    "avg_heart_rate",
    "oxygen_saturation",
    "body_temperature",
    "sleep_duration"
  ],
  muscle_health: [
    "muscle_atrophy",
    "muscle_fiber_type_i",
    "muscle_fiber_type_ii",
    "neuromuscular_coordination"
  ],
  bone_health: [
    "bone_density",
    "bone_quality",
    "bone_metabolism_p1np",
    "bone_metabolism_ctx"
  ],
  organ_health: [
    "arrhythmia",
    "kidney_stones_risk",
    "oxygen_status"
  ],
  space_radiation: [
    "daily_radiation_dose",
    "cumulative_mission_dose",
    "radiation_dose_rate",
    "radiation_event"
  ]
};

async function getMetricHistory(userId, table, metric, limit = 365) {
  if (!Object.hasOwn(TABLES, table)) {
    throw new Error("Invalid health table");
  }

  if (!TABLES[table].includes(metric)) {
    throw new Error("Invalid health metric");
  }

  const safeLimit = Math.min(
    2000,
    Math.max(1, Number.isInteger(limit) ? limit : 365)
  );

  // Table and column identifiers come only from the whitelist.
  // User-controlled values are parameterized.
  const [rows] = await db.execute(
    `SELECT
       id,
       ${metric} AS value,
       DATE_FORMAT(
         recorded_at,
         '%Y-%m-%dT%H:%i:%s'
       ) AS recordedAt
     FROM ${table}
     WHERE user_id = ?
       AND ${metric} IS NOT NULL
     ORDER BY recorded_at DESC, id DESC
     LIMIT ${safeLimit}`,
    [userId]
  );

  return rows.reverse().map(row => ({
    id: row.id,
    value: Number(row.value),
    recordedAt: row.recordedAt
  }));
}

async function getAllLatest(userId) {
  const result = {};

  for (const [table, metrics] of Object.entries(TABLES)) {
    result[table] = {};

    for (const metric of metrics) {
      const history = await getMetricHistory(
        userId,
        table,
        metric,
        1
      );

      result[table][metric] = history[0] || null;
    }
  }

  return result;
}

module.exports = {
  TABLES,
  getMetricHistory,
  getAllLatest
};
