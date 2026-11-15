// Units match the space_radiation records produced by Backend/server/seed.js.
export const RADIATION_METRICS = [
  { key: "dailyRadiationDose", label: "Daily radiation dose", unit: "mSv", digits: 4 },
  { key: "cumulativeMissionDose", label: "Cumulative mission dose", unit: "mSv", digits: 3 },
  { key: "radiationDoseRate", label: "Radiation dose rate", unit: "µSv/h", digits: 4 }
];

export const hasRadiationValue = value => typeof value === "number" && Number.isFinite(value) && value >= 0;
export const formatRadiationValue = (value, digits = 4) => hasRadiationValue(value)
  ? value.toLocaleString("en-US", { maximumFractionDigits: digits }) : "—";
export const formatRadiationDate = value => value ? String(value).replace("T", " ") : "Not available";

export function getRadiationView(rows, metricKey, range = "30") {
  const sorted = [...rows].sort((a, b) =>
    String(b.recordedAt ?? "").localeCompare(String(a.recordedAt ?? "")) || Number(b.id) - Number(a.id));
  const latest = Object.fromEntries(RADIATION_METRICS.map(({ key }) =>
    [key, sorted.find(row => hasRadiationValue(row[key])) ?? null]));
  const eligible = sorted.filter(row => hasRadiationValue(row[metricKey]));
  const chartRows = range === "all" ? eligible : eligible.slice(0, Number(range));
  const values = chartRows.map(row => row[metricKey]);
  const stats = values.length ? {
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    min: Math.min(...values), max: Math.max(...values), count: values.length
  } : null;
  return { sorted, latest, chartRows, stats };
}
