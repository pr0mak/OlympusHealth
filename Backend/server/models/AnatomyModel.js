
const pool = require("../config/db");

// Valid muscle regions
const MUSCLE_KEYS = new Set([
  "left_arm",
  "right_arm",
  "chest",
  "back",
  "abdominals",
  "left_upper_leg",
  "right_upper_leg",
  "left_lower_leg",
  "right_lower_leg",
  "neck",
]);

// Valid bone regions
const BONE_KEYS = new Set([
  "skeleton_right_arm",
  "skeleton_left_arm",
  "skeleton_right_leg",
  "skeleton_left_leg",
  "pelvis",
  "spine",
  "ribs",
  "skull",
]);

// Organ key -> MySQL table
const ORGAN_TABLES = Object.freeze({
  brain: "brain",
  heart: "heart",

  lung_l: "lungs",
  lung_r: "lungs",
  lungs: "lungs",

  liver: "liver",

  kidney_l: "kidneys",
  kidney_r: "kidneys",
  kidneys: "kidneys",

  small_intestine: "small_intestine",
});

// ==========================================
// MUSCLE STATUS
// ==========================================
async function getMuscle(userId, regionKey) {
  if (!MUSCLE_KEYS.has(regionKey)) {
    return undefined;
  }

  const [rows] = await pool.execute(
    `SELECT
       region_key,
       estimated_recovery AS recoveryHours,
       soreness,
       fatigue,
       strength,
       endurance
     FROM muscle_status
     WHERE user_id = ?
       AND region_key = ?
     LIMIT 1`,
    [userId, regionKey]
  );

  return rows[0] ?? null;
}

// ==========================================
// BONE STATUS
// ==========================================
async function getBone(userId, regionKey) {
  if (!BONE_KEYS.has(regionKey)) {
    return undefined;
  }

  const [rows] = await pool.execute(
    `SELECT
       region_key,
       bone_density AS density,
       bone_structure AS structure,
       bone_strength AS strength,
       bone_building AS formation,
       bone_breakdown AS breakdown
     FROM bone_status
     WHERE user_id = ?
       AND region_key = ?
     LIMIT 1`,
    [userId, regionKey]
  );

  return rows[0] ?? null;
}

// ==========================================
// ORGAN STATUS
// ==========================================
async function getOrgan(userId, key) {
  const table = ORGAN_TABLES[key];

  if (!table) {
    return undefined;
  }

  const [rows] = await pool.execute(
    `SELECT *
     FROM \`${table}\`
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] ?? null;
}

module.exports = {
  getMuscle,
  getBone,
  getOrgan,
};
