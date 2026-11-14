
const PRIORITY_ORDER = {
  high: 0,
  medium: 1,
  low: 2
};

function addAlert(alerts, {
  id,
  title,
  detail,
  priority,
  recordedAt
}) {
  alerts.push({
    id,
    title,
    detail,
    priority,
    recordedAt
  });
}

function generateGenericHealthAlerts(record) {
  if (!record) return [];

  const alerts = [];
  const recordedAt = record.recorded_at ?? record.recordedAt ?? null;

  function check({
    field,
    key,
    title,
    unit,
    classify,
    normalRange
  }) {
    const rawValue = record[field] ?? record[key];

    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return;
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value)) return;

    const priority = classify(value);

    if (!priority) return;

    addAlert(alerts, {
      id: `generic-${record.id}-${key}`,
      title,
      detail:
        `${title}: ${value} ${unit}. ` +
        `Expected monitoring range: ${normalRange}. ` +
        `Priority: ${priority.toUpperCase()}.`,
      priority,
      recordedAt
    });
  }

  // HEART RATE
  check({
    field: "avg_heart_rate",
    key: "heartRate",
    title: "Heart Rate Outside Monitoring Range",
    unit: "bpm",
    normalRange: "60-100 bpm",
    classify: value => {
      if (value < 45 || value >= 120) return "high";
      if (value < 50 || value > 100) return "medium";
      if (value < 60) return "low";
      return null;
    }
  });

  // OXYGEN SATURATION
  check({
    field: "oxygen_saturation",
    key: "oxygenSaturation",
    title: "Low Oxygen Saturation",
    unit: "%",
    normalRange: "95-100%",
    classify: value => {
      if (value < 93) return "high";
      if (value < 95) return "medium";
      return null;
    }
  });

  // BODY TEMPERATURE
  check({
    field: "body_temperature",
    key: "bodyTemperature",
    title: "Body Temperature Outside Monitoring Range",
    unit: "°C",
    normalRange: "36.1-37.49°C",
    classify: value => {
      if (value < 35 || value >= 39.5) return "high";
      if (value < 36 || value >= 38) return "medium";
      if (value < 36.1 || value >= 37.5) return "low";
      return null;
    }
  });

  // SLEEP DURATION
  check({
    field: "sleep_duration",
    key: "sleepHours",
    title: "Sleep Duration Outside Monitoring Range",
    unit: "hours",
    normalRange: "7-10 hours",
    classify: value => {
      if (value < 4) return "high";
      if (value < 6 || value > 12) return "medium";
      if (value < 7 || value > 10) return "low";
      return null;
    }
  });

  return alerts.sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] -
      PRIORITY_ORDER[b.priority]
  );
}

module.exports = {
  generateGenericHealthAlerts
};
