import assert from "node:assert/strict";
import { getHeartRatePreview } from "../src/services/healthPreview.js";

const rows = [
  { id: 4, recordedAt: "2026-10-31T12:00:00", heartRate: null },
  { id: 3, recordedAt: "2026-10-30T12:00:00", heartRate: 65 },
  { id: 1, recordedAt: "2026-10-29T12:00:00", heartRate: 72 },
  { id: 2, recordedAt: "2026-10-30T12:00:00", heartRate: 68 }
];
const original = structuredClone(rows);
assert.deepEqual(getHeartRatePreview(rows), {
  heartRate: 65,
  history: [72, 68, 65]
}, "Use the latest stored average, skipping nulls and breaking timestamp ties by ID.");
assert.deepEqual(rows, original, "Do not reorder or mutate the API response.");
assert.deepEqual(getHeartRatePreview([...rows].reverse()), {
  heartRate: 65,
  history: [72, 68, 65]
}, "The chart must be chronological regardless of API response order.");
assert.deepEqual(getHeartRatePreview([]), { heartRate: null, history: [] });
assert.deepEqual(getHeartRatePreview(
  [null, undefined, NaN, Infinity, "", "invalid", 0, -5].map(heartRate => ({ heartRate }))
), { heartRate: null, history: [] }, "Missing or invalid readings must not become fake heart rates.");
assert.deepEqual(getHeartRatePreview([
  { id: 1, recordedAt: "2026-10-30T12:00:00", heartRate: 65 }
]), { heartRate: 65, history: [65] });

console.log("Health preview checks passed.");
