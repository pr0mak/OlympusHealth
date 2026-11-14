export const heartRate = [68, 70, 69, 75, 78, 73, 71, 72];
export const weeklyHeartRate = [71, 73, 70, 74, 69, 71, 72];

export const healthMetrics = [
  { label: 'Heart rate', value: '72', unit: 'bpm' },
  { label: 'Oxygen saturation', value: '98', unit: '%' },
  { label: 'Body temperature', value: '36.6', unit: '°C' },
  { label: 'Sleep duration', value: '7.5', unit: 'hours' },
];

export const measurements = [
  { time: '14:00', metric: 'Heart rate', value: '72 bpm', source: 'Wearable' },
  { time: '14:00', metric: 'Oxygen saturation', value: '98%', source: 'Wearable' },
  { time: '12:00', metric: 'Body temperature', value: '36.6 °C', source: 'Manual entry' },
  { time: '07:00', metric: 'Sleep duration', value: '7.5 hours', source: 'Wearable' },
];

// A visual sample for the scenario UI, not a physiological prediction model.
export function createProjection(days = 7, sleep = 7.5, exercise = 30) {
  return Array.from({ length: days + 1 }, (_, index) =>
    Math.round(60 + index * (0.3 + (sleep - 7) * 0.15 + exercise / 150)),
  );
}
