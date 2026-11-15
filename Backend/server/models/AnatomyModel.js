// Adjust this import to your existing mysql2/promise pool module.
const pool = require('../config/db');

const MUSCLE_KEYS = new Set(['left_arm','right_arm','chest','back','abdominals','left_upper_leg','right_upper_leg','left_lower_leg','right_lower_leg','neck']);
const BONE_KEYS = new Set(['skeleton_right_arm','skeleton_left_arm','skeleton_right_leg','skeleton_left_leg','pelvis','spine','ribs','skull']);
const ORGAN_TABLES = Object.freeze({brain:'brain',heart:'heart',lung_l:'lungs',lung_r:'lungs',lungs:'lungs',liver:'liver',kidney_l:'kidneys',kidney_r:'kidneys',kidneys:'kidneys',small_intestine:'small_intestine'});

async function getMuscle(userId, key) {
  if (!MUSCLE_KEYS.has(key)) return undefined;
  const [rows] = await pool.execute(`SELECT region_key, estimated_recovery AS recoveryHours, soreness, fatigue, strength, endurance FROM muscle_status WHERE user_id = ? AND region_key = ? LIMIT 1`, [userId, key]);
  return rows[0] ?? null;
}
async function getBone(userId, key) {
  if (!BONE_KEYS.has(key)) return undefined;
  const [rows] = await pool.execute(`SELECT region_key, bone_density AS density, bone_structure AS structure, bone_strength AS strength, bone_building AS formation, bone_breakdown AS breakdown FROM bone_status WHERE user_id = ? AND region_key = ? LIMIT 1`, [userId, key]);
  return rows[0] ?? null;
}
async function getOrgan(userId, key) {
  const table = ORGAN_TABLES[key];
  if (!table) return undefined;
  const [rows] = await pool.execute(`SELECT * FROM \`${table}\` WHERE user_id = ? LIMIT 1`, [userId]);
  return rows[0] ?? null;
}
module.exports = {getMuscle,getBone,getOrgan};
