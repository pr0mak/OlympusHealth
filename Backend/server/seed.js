
require("dotenv").config();

const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const PASSWORD = "AstraDemo2026!";
const DAYS = 30;
const START_DATE = "2026-10-01";

const USERS = [
  { username: "alex_morgan", gender: "male", age: 29 },
  { username: "james_wilson", gender: "male", age: 35 },
  { username: "daniel_cooper", gender: "male", age: 42 },
  { username: "emma_johnson", gender: "female", age: 28 },
  { username: "sophia_miller", gender: "female", age: 37 },
];

const TABLES = [
  "generic_health",
  "muscle_health",
  "bone_health",
  "organ_health",
  "space_radiation",
];

// Reproducible synthetic data
let randomState = 2026;

function random() {
  randomState =
    (1664525 * randomState + 1013904223) >>> 0;

  return randomState / 4294967296;
}

function between(min, max) {
  return min + random() * (max - min);
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function dateAtDay(day) {
  const date = new Date(`${START_DATE}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + day);

  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function insertRows(connection, table, columns, rows) {
  if (rows.length === 0) return;

  const placeholders = rows
    .map(() => `(${columns.map(() => "?").join(", ")})`)
    .join(", ");

  const sql = `
    INSERT INTO ${table}
    (${columns.join(", ")})
    VALUES ${placeholders}
  `;

  await connection.execute(sql, rows.flat());
}

async function seedUsers(connection) {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  for (const user of USERS) {
    await connection.execute(
      `INSERT INTO users
       (username, password, gender, age)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         username = username`,
      [
        user.username,
        passwordHash,
        user.gender,
        user.age,
      ]
    );
  }

  const usernames = USERS.map((user) => user.username);
  const placeholders = usernames.map(() => "?").join(", ");

  const [rows] = await connection.execute(
    `SELECT id, username, gender, age
     FROM users
     WHERE username IN (${placeholders})`,
    usernames
  );

  if (rows.length !== USERS.length) {
    throw new Error("Could not load all demo users.");
  }

  console.log(`Users ready: ${rows.length}`);

  return rows;
}

function generateHealthData(user, userIndex) {
  const data = {
    generic_health: [],
    muscle_health: [],
    bone_health: [],
    organ_health: [],
    space_radiation: [],
  };

  // Individual synthetic baselines
  const baseHeartRate = between(60, 80);
  const baseTemperature = between(36.4, 36.8);
  const baseOxygen = between(97, 99);
  const baseSleep = between(6.8, 8.2);

  const baseReactionTime = between(210, 270);
  const baseFiberTypeI = between(40, 60);

  const baseBmd = between(0.95, 1.25);
  const baseTbs = between(1.30, 1.48);
  const baseP1np = between(30, 60);
  const baseCtx = between(250, 450);

  const baseKidneyRisk = between(5, 15);
  const baseRadiationDose = between(0.30, 0.65);

  let cumulativeDose = 0;
  let muscleAtrophy = 0;

  for (let day = 0; day < DAYS; day++) {
    const recordedAt = dateAtDay(day);
    const progress = day / (DAYS - 1);

    // 1. GENERIC HEALTH
    const heartRate = Math.round(
      clamp(baseHeartRate + between(-5, 5), 45, 110)
    );

    const oxygen = round(
      clamp(baseOxygen + between(-1, 1), 94, 100)
    );

    const temperature = round(
      clamp(baseTemperature + between(-0.25, 0.25), 35.5, 38)
    );

    const sleep = round(
      clamp(baseSleep + between(-1.2, 1.2), 4, 10)
    );

    data.generic_health.push([
      user.id,
      heartRate,
      oxygen,
      temperature,
      sleep,
      recordedAt,
    ]);

    // 2. MUSCLE HEALTH
    if (day > 0) {
      muscleAtrophy += between(0.01, 0.10);
    }

    const fiberTypeI = round(
      clamp(
        baseFiberTypeI - progress * between(1, 5),
        0,
        100
      )
    );

    const fiberTypeII = round(100 - fiberTypeI);

    const reactionTime = round(
      baseReactionTime +
      progress * between(5, 25) +
      between(-5, 5)
    );

    data.muscle_health.push([
      user.id,
      round(muscleAtrophy),
      fiberTypeI,
      fiberTypeII,
      reactionTime,
      recordedAt,
    ]);

    // 3. BONE HEALTH
    const boneDensity = round(
      baseBmd * (1 - progress * between(0.002, 0.012)),
      3
    );

    const boneQuality = round(
      baseTbs - progress * between(0.005, 0.025)
    );

    const p1np = round(
      baseP1np + progress * between(-3, 5)
    );

    const ctx = round(
      baseCtx + progress * between(10, 80)
    );

    data.bone_health.push([
      user.id,
      boneDensity,
      boneQuality,
      p1np,
      ctx,
      recordedAt,
    ]);

    // 4. ORGAN HEALTH
    const arrhythmia = random() < 0.025 ? 1 : 0;

    const kidneyRisk = round(
      clamp(
        baseKidneyRisk +
        progress * between(2, 8) +
        between(-1, 1),
        0,
        100
      )
    );

    data.organ_health.push([
      user.id,
      arrhythmia,
      kidneyRisk,
      oxygen,
      recordedAt,
    ]);

    // 5. SPACE RADIATION
    const radiationEvent = random() < 0.03 ? 1 : 0;

    const dailyDose = round(
      baseRadiationDose +
      between(-0.08, 0.08) +
      (radiationEvent ? between(0.5, 1.5) : 0),
      4
    );

    cumulativeDose = round(
      cumulativeDose + dailyDose,
      3
    );

    // Synthetic average rate, in μSv/h
    const doseRate = round(
      dailyDose * 1000 / 24,
      4
    );

    data.space_radiation.push([
      user.id,
      dailyDose,
      cumulativeDose,
      doseRate,
      radiationEvent,
      recordedAt,
    ]);
  }

  console.log(
    `Generated health data for ${user.username} (${userIndex + 1}/5)`
  );

  return data;
}

const TABLE_COLUMNS = {
  generic_health: [
    "user_id",
    "avg_heart_rate",
    "oxygen_saturation",
    "body_temperature",
    "sleep_duration",
    "recorded_at",
  ],
  muscle_health: [
    "user_id",
    "muscle_atrophy",
    "muscle_fiber_type_i",
    "muscle_fiber_type_ii",
    "neuromuscular_coordination",
    "recorded_at",
  ],
  bone_health: [
    "user_id",
    "bone_density",
    "bone_quality",
    "bone_metabolism_p1np",
    "bone_metabolism_ctx",
    "recorded_at",
  ],
  organ_health: [
    "user_id",
    "arrhythmia",
    "kidney_stones_risk",
    "oxygen_status",
    "recorded_at",
  ],
  space_radiation: [
    "user_id",
    "daily_radiation_dose",
    "cumulative_mission_dose",
    "radiation_dose_rate",
    "radiation_event",
    "recorded_at",
  ],
};

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await connection.beginTransaction();

    const users = await seedUsers(connection);

    const start = dateAtDay(0);
    const end = dateAtDay(DAYS - 1);

    const counts = Object.fromEntries(
      TABLES.map((table) => [table, 0])
    );

    for (const [index, user] of users.entries()) {
      const healthData = generateHealthData(user, index);

      for (const table of TABLES) {
        // Never overwrite existing measurements.
        // Skip this table/user if the date range already has data.
        const [existing] = await connection.execute(
          `SELECT COUNT(*) AS total
           FROM ${table}
           WHERE user_id = ?
             AND recorded_at >= ?
             AND recorded_at < DATE_ADD(?, INTERVAL 1 DAY)`,
          [user.id, start, end]
        );

        if (existing[0].total > 0) {
          console.log(
            `Skipping ${table} for ${user.username}: ` +
            "measurements already exist in this period"
          );
          continue;
        }

        await insertRows(
          connection,
          table,
          TABLE_COLUMNS[table],
          healthData[table]
        );

        counts[table] += healthData[table].length;
      }
    }

    await connection.commit();

    console.log("\nASTRA SEED COMPLETED");
    console.log("----------------------");
    console.log("Demo users: 5");
    console.log("Days per user: 30");

    for (const table of TABLES) {
      console.log(`${table}: ${counts[table]} new records`);
    }

    console.log("\nDemo password:", PASSWORD);
  } catch (error) {
    await connection.rollback();
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

seed().catch((error) => {
  console.error("Database connection failed:", error);
  process.exitCode = 1;
});
