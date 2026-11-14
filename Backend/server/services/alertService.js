
const db = require("../config/db");

const {
  generateGenericHealthAlerts
} = require("./genericHealthAlertRules");

// Health tables and fields are hard-coded for safety.
const SOURCES = [
  [
    "generic_health",
    [
      "avg_heart_rate",
      "oxygen_saturation",
      "body_temperature",
      "sleep_duration"
    ]
  ],
  ["bone_health", ["bone_density"]],
  ["muscle_health", ["muscle_atrophy"]],
  ["organ_health", ["arrhythmia"]],
  ["space_radiation", ["radiation_event"]]
];

const RANK = {
  high: 0,
  medium: 1,
  low: 2
};

function numeric(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function createAlert(priority, title, detail, source, row) {
  return {
    id: `${source}-${row.id}-${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}`,
    priority,
    title,
    detail,
    source,
    recordedAt: row.recorded_at
  };
}

function dateAgeDays(value) {
  if (!value) return null;

  const date = new Date(
    String(value).replace(" ", "T")
  );

  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return (Date.now() - date.getTime()) / 86400000;
}

function compareAlerts(a, b) {
  const priorityA = RANK[a.priority] ?? 3;
  const priorityB = RANK[b.priority] ?? 3;

  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }

  const dateA = String(a.recordedAt || "");
  const dateB = String(b.recordedAt || "");

  return dateB.localeCompare(dateA);
}

async function getUserAlerts(userId) {
  // Read only the logged-in user's health records.
  const results = await Promise.all(
    SOURCES.map(async ([table, fields]) => {
      const [rows] = await db.execute(
        `SELECT
           id,
           ${fields.join(", ")},
           DATE_FORMAT(
             recorded_at,
             '%Y-%m-%dT%H:%i:%s'
           ) AS recorded_at
         FROM ${table}
         WHERE user_id = ?
         ORDER BY recorded_at DESC, id DESC
         LIMIT 2`,
        [userId]
      );

      return [table, rows];
    })
  );

  const data = Object.fromEntries(results);
  const alerts = [];

  function add(priority, title, detail, table, row) {
    alerts.push(
      createAlert(priority, title, detail, table, row)
    );
  }

  // ===========================================
  // 1. GENERIC HEALTH ALERTS
  // ===========================================

  const generic = data.generic_health || [];
  const latestGeneric = generic[0];

  if (latestGeneric) {
    const genericAlerts =
      generateGenericHealthAlerts(latestGeneric);

    for (const alert of genericAlerts) {
      alerts.push({
        ...alert,
        source: "generic_health"
      });
    }
  }

  // ===========================================
  // 2. ORGAN HEALTH ALERTS
  // ===========================================

  const organ = data.organ_health?.[0];

  if (
    organ &&
    numeric(organ.arrhythmia) === 1
  ) {
    add(
      "high",
      "Arrhythmia flag recorded",
      "An arrhythmia flag is present in the database. Confirm its source and review it promptly.",
      "organ_health",
      organ
    );
  }

  // ===========================================
  // 3. SPACE RADIATION ALERTS
  // ===========================================

  const radiation = data.space_radiation?.[0];

  if (
    radiation &&
    numeric(radiation.radiation_event) === 1
  ) {
    add(
      "medium",
      "Radiation event flag recorded",
      "A radiation event flag was recorded. Inspect the associated radiation records and mission procedures.",
      "space_radiation",
      radiation
    );
  }

  // ===========================================
  // 4. BONE HEALTH ALERTS
  // ===========================================

  const bone = data.bone_health || [];

  if (bone.length === 2) {
    const currentDensity = numeric(
      bone[0].bone_density
    );

    const previousDensity = numeric(
      bone[1].bone_density
    );

    if (
      currentDensity !== null &&
      previousDensity !== null &&
      currentDensity > 0 &&
      previousDensity > 0
    ) {
      const change =
        ((currentDensity - previousDensity) /
          previousDensity) * 100;

      if (change <= -5) {
        add(
          "medium",
          "Bone density trend needs review",
          `Recorded bone density decreased by ${Math.abs(
            change
          ).toFixed(1)}% between the last two entries. Measurement comparability has not been verified.`,
          "bone_health",
          bone[0]
        );
      }
    }
  }

  // ===========================================
  // 5. MUSCLE HEALTH ALERTS
  // ===========================================

  const muscle = data.muscle_health || [];

  if (muscle.length === 2) {
    const currentAtrophy = numeric(
      muscle[0].muscle_atrophy
    );

    const previousAtrophy = numeric(
      muscle[1].muscle_atrophy
    );

    if (
      currentAtrophy !== null &&
      previousAtrophy !== null
    ) {
      const difference =
        currentAtrophy - previousAtrophy;

      if (difference >= 5) {
        add(
          "medium",
          "Muscle atrophy trend needs review",
          `Recorded muscle atrophy increased by ${difference.toFixed(
            1
          )} points across the last two records.`,
          "muscle_health",
          muscle[0]
        );
      }
    }
  }

  // ===========================================
  // 6. DATA FRESHNESS ALERT
  // ===========================================

  const dates = Object.values(data).flatMap(
    rows =>
      rows.length > 0
        ? [rows[0].recorded_at]
        : []
  );

  if (dates.length > 0) {
    const newest = [...dates].sort().at(-1);
    const age = dateAgeDays(newest);

    if (age !== null && age > 7) {
      add(
        "low",
        "Health records need updating",
        `The newest record is from ${newest.replace(
          "T",
          " "
        )}; these alerts describe historical data.`,
        "data_freshness",
        {
          id: 0,
          recorded_at: newest
        }
      );
    }
  }

  // ===========================================
  // 7. SORT ALERTS BY PRIORITY
  // ===========================================

  alerts.sort(compareAlerts);

  // ===========================================
  // 8. COUNT ALERTS
  // ===========================================

  const counts = {
    high: 0,
    medium: 0,
    low: 0
  };

  for (const alert of alerts) {
    if (Object.hasOwn(counts, alert.priority)) {
      counts[alert.priority]++;
    }
  }

  // ===========================================
  // 9. RETURN RESPONSE
  // ===========================================

  const reviewedRecords = Object.fromEntries(
    results.map(([table, rows]) => [
      table,
      rows.length
    ])
  );

  return {
    alerts,
    counts,
    reviewedRecords
  };
}

module.exports = {
  getUserAlerts
};
