import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { getRadiationView, formatRadiationValue, RADIATION_METRICS } from "../src/services/radiationData.js";

const rows = [
  { id: 1, recordedAt: "2026-11-13T12:00:00", dailyRadiationDose: 0, cumulativeMissionDose: 4.7, radiationDoseRate: null },
  { id: 3, recordedAt: "2026-11-15T12:00:00", dailyRadiationDose: null, cumulativeMissionDose: 5.2, radiationDoseRate: 0 },
  { id: 2, recordedAt: "2026-11-14T12:00:00", dailyRadiationDose: 0.5, cumulativeMissionDose: 5.2, radiationDoseRate: 20.8333 }
];
const original = structuredClone(rows);
let view = getRadiationView(rows, "dailyRadiationDose");
assert.deepEqual(view.sorted.map(row => row.id), [3, 2, 1]);
assert.equal(view.latest.dailyRadiationDose.id, 2);
assert.equal(view.latest.radiationDoseRate.radiationDoseRate, 0);
assert.equal(view.latest.cumulativeMissionDose.cumulativeMissionDose, 5.2, "Use the stored cumulative value without summing it again.");
assert.deepEqual(view.stats, { average: 0.25, min: 0, max: 0.5, count: 2 });
assert.deepEqual(rows, original);
assert.equal(formatRadiationValue(null), "—");
assert.equal(formatRadiationValue(NaN), "—");
assert.equal(formatRadiationValue(-1), "—");
assert.equal(formatRadiationValue(0), "0");
assert.equal(formatRadiationValue(20.8333), "20.8333");
assert.equal(getRadiationView([], "dailyRadiationDose").stats, null);
const many = Array.from({ length: 45 }, (_, index) => ({
  id: index, recordedAt: new Date(Date.UTC(2026, 9, index + 1)).toISOString(), dailyRadiationDose: index / 10
}));
assert.equal(getRadiationView(many, "dailyRadiationDose", "7").chartRows.length, 7);
assert.equal(getRadiationView(many, "dailyRadiationDose", "30").chartRows.length, 30);
assert.equal(getRadiationView(many, "dailyRadiationDose", "all").chartRows.length, 45);
assert.deepEqual(RADIATION_METRICS.map(metric => metric.unit), ["mSv", "mSv", "µSv/h"]);

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
const oldFetch = globalThis.fetch;
try {
  const { RadiationReadings } = await server.ssrLoadModule("/src/components/RadiationData.jsx");
  const markup = renderToStaticMarkup(React.createElement(RadiationReadings, { rows, username: "astronautA" }));
  for (const text of ["astronautA", "Daily radiation dose", "Cumulative mission dose", "Radiation dose rate", "Measurement history", "Last 7 records", "Last 30 records", "All records", "20.8333", "mSv", "µSv/h"]) {
    assert(markup.includes(renderToStaticMarkup(text)), `Missing radiation content: ${text}`);
  }
  assert(markup.includes("2 recorded readings"));
  assert(!markup.includes("NaN") && !markup.includes("Infinity"));
  const empty = renderToStaticMarkup(React.createElement(RadiationReadings, { rows: [], username: "astronautB" }));
  assert(empty.includes("No radiation measurements are stored for this account."));
  assert(!empty.includes("astronautA"));
  const { default: Drawer } = await server.ssrLoadModule("/src/components/RadiationDrawer.jsx");
  const closed = renderToStaticMarkup(React.createElement(Drawer));
  assert(closed.includes('aria-label="Open radiation exposure"'));
  assert(closed.includes('aria-expanded="false"'));
  assert(closed.includes('data-state="closed"'));
  assert(closed.includes('id="radiation-dialog"'));
  assert(closed.includes('open=""'), "The same card must remain modeless and partly visible at the screen edge.");
  assert(closed.indexOf('class="radiation-tab"') > closed.indexOf('<dialog'), "The tab must be inside the sliding card, not a separate element.");
  assert(closed.includes('aria-modal="false"'));
  assert(closed.includes('class="radiation-dialog-content" inert="" aria-hidden="true"'));
  assert(!closed.includes("Measurement history"), "Do not mount/fetch radiation readings until the drawer is opened.");

  const { healthApi } = await server.ssrLoadModule("/src/services/healthApi.js");
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert(url.endsWith("/api/health/radiation"));
    assert.equal(options.headers.Authorization, "Bearer test-user-token");
    assert.equal(options.signal, controller.signal);
    return { ok: true, json: async () => ({ success: true, data: rows }) };
  };
  assert.deepEqual((await healthApi.getRadiationMeasurements("test-user-token", { signal: controller.signal })).data, rows);
  console.log("Radiation UI checks passed: latest values, units, zero/null handling, chart ranges, empty states, closed drawer and authenticated fetch.");
} finally {
  globalThis.fetch = oldFetch;
  await server.close();
}
