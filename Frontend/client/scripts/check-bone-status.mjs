import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { mockBoneStatus } from "../src/data/mockBoneStatus.js";
import { muscleGroups } from "../src/data/muscleGroups.js";
import { initialSidebarState, sidebarTransition } from "../src/components/sidebarTransition.js";

const catalog = JSON.parse(await readFile(new URL("../src/data/anatomyCatalog.json", import.meta.url), "utf8"));
const bones = catalog.filter(part => part.system === "skeleton" && part.sex !== "female");
assert.deepEqual(Object.keys(mockBoneStatus).sort(), bones.map(({ key }) => key).sort(),
  "Every selectable skeleton region must have a demo fixture.");
for (const status of Object.values(mockBoneStatus)) {
  assert(Number.isFinite(status.density) && status.density > 0);
  for (const key of ["structure", "strength", "formation", "breakdown"]) {
    assert(Number.isInteger(status[key]) && status[key] >= 1 && status[key] <= 10);
  }
}

const select = (state, selection) => sidebarTransition(state, { type: "select", selection });
const exit = state => sidebarTransition(state, { type: "exit-complete" });
const enter = state => sidebarTransition(state, { type: "entry-complete" });
const bone = bones.find(({ key }) => key === "femur_l");
const otherBone = bones.find(({ key }) => key === "humerus_l");

// Bone selection retains the old content until its exit completes.
let state = select(initialSidebarState, bone);
assert.equal(state.displayed, null);
assert.equal(state.phase, "exiting");
state = enter(exit(state));
assert.equal(state.displayed, bone);
state = select(state, otherBone);
assert.equal(state.displayed, bone);
state = enter(exit(state));
assert.equal(state.displayed, otherBone);
state = enter(exit(select(state, null)));
assert.equal(state.displayed, null);
assert.equal(state.phase, "idle");

// Mixed selections, including rapid updates during entry, use the same queue.
state = exit(select(initialSidebarState, muscleGroups[0]));
state = select(select(state, bone), otherBone);
assert.equal(state.displayed, muscleGroups[0]);
state = enter(exit(enter(state)));
assert.equal(state.displayed, otherBone);
state = enter(exit(select(state, muscleGroups[1])));
assert.equal(state.displayed, muscleGroups[1]);

// Render through the app's JSX pipeline to verify shared layout and every fixture.
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
try {
  const { default: BonePanel } = await server.ssrLoadModule("/src/components/BoneStatusPanel.jsx");
  const { default: MusclePanel } = await server.ssrLoadModule("/src/components/MuscleStatusPanel.jsx");
  for (const selection of bones) {
    const markup = renderToStaticMarkup(React.createElement(BonePanel, { selection, onClear() {} }));
    for (const label of [selection.label, "Bone density", "Bone structure", "Bone strength", "Bone turnover", "Bone building", "Bone breakdown", "g/cm²", "Demo data", "Back to overview"]) {
      assert(markup.includes(renderToStaticMarkup(label)), `Missing ${label} for ${selection.key}`);
    }
    assert(markup.includes(mockBoneStatus[selection.key].density.toFixed(3)));
    assert(!markup.includes("No bone data"));
  }
  for (const selection of muscleGroups) {
    const markup = renderToStaticMarkup(React.createElement(MusclePanel, { selection, onClear() {} }));
    for (const label of [selection.label, "Soreness", "Fatigue", "Estimated recovery", "Strength", "Endurance", "hours", "Demo data"]) {
      assert(markup.includes(renderToStaticMarkup(label)), `Muscle panel regression: missing ${label} for ${selection.key}`);
    }
    assert(markup.includes('class="anatomy-status"'));
    assert(!markup.includes("No muscle data"));
  }
} finally {
  await server.close();
}

console.log(`Bone checks passed: ${bones.length} skeleton panels, ${muscleGroups.length} muscle panels, and sidebar transitions.`);
