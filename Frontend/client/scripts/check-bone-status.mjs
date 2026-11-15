import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import { mockBoneStatus } from "../src/data/mockBoneStatus.js";
import { muscleGroups } from "../src/data/muscleGroups.js";
import { boneGroups } from "../src/data/boneGroups.js";
import { initialSidebarState, sidebarTransition } from "../src/components/sidebarTransition.js";

const catalog = JSON.parse(await readFile(new URL("../src/data/anatomyCatalog.json", import.meta.url), "utf8"));
const bones = boneGroups;
assert.equal(bones.length, 8, "Expected eight skeleton selection regions.");
assert.deepEqual(bones.map(part => part.key), [
  "skeleton_right_arm", "skeleton_left_arm", "skeleton_right_leg", "skeleton_left_leg",
  "pelvis", "spine", "ribs", "skull",
]);
assert.equal(new Set([...bones, ...muscleGroups].map(part => part.key)).size,
  bones.length + muscleGroups.length, "Bone and muscle region IDs must not collide.");
const assigned = new Set();
for (const group of bones) {
  assert.equal(group.system, "skeleton");
  assert(group.meshKeys.length > 0);
  for (const key of group.meshKeys) {
    assert.equal(catalog.find(part => part.key === key)?.system, "skeleton");
    assert(!assigned.has(key), "Bone belongs to multiple groups: " + key);
    assigned.add(key);
    if (group.key.startsWith("skeleton_left_")) assert(key.endsWith("_l"));
    if (group.key.startsWith("skeleton_right_")) assert(key.endsWith("_r"));
  }
}
assert.deepEqual([...assigned].sort(), catalog.filter(part => part.system === "skeleton")
  .map(part => part.key).sort(), "Every source skeleton mesh must belong to one region.");
assert.deepEqual(bones.find(part => part.key === "skull").meshKeys, ["skull", "mandible", "teeth"]);
assert.deepEqual(bones.find(part => part.key === "ribs").meshKeys, ["ribs_l", "ribs_r", "sternum"]);
assert.deepEqual(bones.find(part => part.key === "spine").meshKeys,
  ["spine_cervical", "spine_thoracic", "spine_lumbar"]);
assert.deepEqual(bones.find(part => part.key === "pelvis").meshKeys, ["pelvis"]);
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
const bone = bones.find(({ key }) => key === "skeleton_left_leg");
const otherBone = bones.find(({ key }) => key === "skeleton_left_arm");

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
  const renderPanel = (Panel, selection) => renderToStaticMarkup(
    React.createElement(MemoryRouter, null, React.createElement(Panel, { selection, onClear() {} })),
  );
  const { default: BonePanel } = await server.ssrLoadModule("/src/components/BoneStatusPanel.jsx");
  const { default: MusclePanel } = await server.ssrLoadModule("/src/components/MuscleStatusPanel.jsx");
  for (const selection of bones) {
    const markup = renderPanel(BonePanel, selection);
    for (const label of [selection.label, "Bone density", "Bone structure", "Bone strength", "Bone turnover", "Bone building", "Bone breakdown", "g/cm²", "Demo data", "Back to main page"]) {
      assert(markup.includes(renderToStaticMarkup(label)), `Missing ${label} for ${selection.key}`);
    }
    assert(markup.includes(mockBoneStatus[selection.key].density.toFixed(3)));
    assert(!markup.includes("No bone data"));
  }
  for (const selection of muscleGroups) {
    const markup = renderPanel(MusclePanel, selection);
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
