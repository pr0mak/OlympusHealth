
const pool = require("../config/db");

async function getRadiationMeasurements(userId) {
  const [rows] = await pool.execute(
    `
    SELECT
      id,
      daily_radiation_dose AS dailyRadiationDose,
      cumulative_mission_dose AS cumulativeMissionDose,
      radiation_dose_rate AS radiationDoseRate,
      radiation_event AS radiationEvent,
      DATE_FORMAT(
        recorded_at,
        '%Y-%m-%d %H:%i:%s'
      ) AS recordedAt
    FROM space_radiation
    WHERE user_id = ?
    ORDER BY recorded_at DESC, id DESC
    `,
    [userId]
  );

  return rows;
}

module.exports = {
  getRadiationMeasurements
};
