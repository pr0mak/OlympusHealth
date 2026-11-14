import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { mockOrganStatus } from "../src/data/mockOrganStatus.js";
import { initialSidebarState, sidebarTransition } from "../src/components/sidebarTransition.js";

const catalog = JSON.parse(await readFile(new URL("../src/data/anatomyCatalog.json", import.meta.url), "utf8"));
const organs = catalog.filter(part => part.system === "organs" && part.sex !== "female");
assert.deepEqual(Object.keys(mockOrganStatus).sort(), organs.map(({ key }) => key).sort(),
  "Every selectable organ must have a demo profile.");
for (const [key, status] of Object.entries(mockOrganStatus)) {
  assert(status.subtitle && status.note.includes("demo"), `Missing context for ${key}`);
  assert.equal(status.metrics.length, 4);
  const labels = [status.primary, ...status.metrics].map(metric => metric.label);
  assert.equal(new Set(labels).size, labels.length, `Duplicate labels in ${key}`);
  for (const metric of [status.primary, ...status.metrics]) {
    assert(metric.label && typeof metric.unit === "string");
    if (typeof metric.value === "number") assert(Number.isFinite(metric.value) && metric.value >= 0);
    else assert(typeof metric.value === "string" && metric.value.length > 0);
    if (metric.type === "score") assert(Number.isInteger(metric.value) && metric.value >= 1 && metric.value <= 10);
  }
}
assert.notEqual(mockOrganStatus.heart.primary.label, mockOrganStatus.kidney_l.primary.label);
assert.notDeepEqual(mockOrganStatus.liver.metrics.map(metric => metric.label), mockOrganStatus.lung_l.metrics.map(metric => metric.label));
assert.equal(mockOrganStatus.kidney_l.primary.value, mockOrganStatus.kidney_r.primary.value,
  "Combined kidney readings must not imply separate left/right measurements.");
assert(mockOrganStatus.kidney_l.note.includes("both kidneys"));
assert(mockOrganStatus.lung_l.note.includes("overall respiratory system"));

const select = (state, selection) => sidebarTransition(state, { type: "select", selection });
const exit = state => sidebarTransition(state, { type: "exit-complete" });
const enter = state => sidebarTransition(state, { type: "entry-complete" });
const heart = organs.find(({ key }) => key === "heart");
const kidney = organs.find(({ key }) => key === "kidney_l");
const lung = organs.find(({ key }) => key === "lung_l");
let state = select(initialSidebarState, heart);
assert.equal(state.displayed, null);
assert.equal(state.phase, "exiting");
state = enter(exit(state));
assert.equal(state.displayed, heart);
assert.equal(select(state, heart), state);
state = select(select(state, kidney), lung);
assert.equal(state.displayed, heart);
state = enter(exit(state));
assert.equal(state.displayed, lung);
state = enter(exit(select(state, null)));
assert.equal(state.displayed, null);
assert.equal(state.phase, "idle");
// A reset during an organ entry still completes the reverse transition.
state = select(exit(select(initialSidebarState, heart)), null);
state = enter(exit(enter(state)));
assert.equal(state.displayed, null);
assert.equal(state.phase, "idle");

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
try {
  const { default: Panel } = await server.ssrLoadModule("/src/components/OrganStatusPanel.jsx");
  const { default: Sidebar } = await server.ssrLoadModule("/src/components/OverviewSidebar.jsx");
  for (const selection of organs) {
    const status = mockOrganStatus[selection.key];
    const markup = renderToStaticMarkup(React.createElement(Panel, { selection, onClear() {} }));
    const labels = [selection.label, status.subtitle, status.note, "Organ", "Demo data", "Back to overview"];
    for (const metric of [status.primary, ...status.metrics]) {
      labels.push(metric.label, String(metric.value));
      if (metric.unit) labels.push(metric.unit);
    }
    for (const label of labels) {
      assert(markup.includes(renderToStaticMarkup(label)), `Missing ${label} for ${selection.key}`);
    }
    assert(!markup.includes("No organ data"));
    assert(!markup.includes("NaN"));
    assert(markup.includes('class="anatomy-status"'));
  }
  const overview = renderToStaticMarkup(React.createElement(Sidebar,
    { selection: null, onClear() {} }, React.createElement("div", null, "Overview widgets")));
  assert(overview.includes("Overview widgets") && overview.includes('data-phase="idle"'));
  assert(!overview.includes('id="anatomy-status-title"'));
} finally {
  await server.close();
}

console.log(`Organ checks passed: ${organs.length} distinct organ panels, fixture coverage and sidebar transitions.`);
