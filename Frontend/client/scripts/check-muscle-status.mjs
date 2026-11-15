import assert from "node:assert/strict";
import { initialSidebarState, sidebarTransition } from "../src/components/sidebarTransition.js";
import { mockMuscleStatus } from "../src/data/mockMuscleStatus.js";
import { muscleGroups } from "../src/data/muscleGroups.js";

const chest = muscleGroups.find(({ key }) => key === "chest");
const arm = muscleGroups.find(({ key }) => key === "left_arm");
const neck = muscleGroups.find(({ key }) => key === "neck");
const back = muscleGroups.find(({ key }) => key === "back");
const select = (state, selection) => sidebarTransition(state, { type: "select", selection });
const exit = (state) => sidebarTransition(state, { type: "exit-complete" });
const enter = (state) => sidebarTransition(state, { type: "entry-complete" });

// The old content stays mounted through its entire exit, then the new panel enters.
let state = select(initialSidebarState, chest);
assert.equal(state.phase, "exiting");
assert.equal(state.displayed, null);
state = exit(state);
assert.equal(state.phase, "entering");
assert.equal(state.displayed, chest);
state = enter(state);
assert.equal(state.phase, "idle");
assert.equal(select(state, chest), state, "Repeated clicks must not restart the animation.");

// Changing muscles and clearing selection both go out to the right, then in.
state = select(state, arm);
assert.equal(state.displayed, chest);
assert.equal(state.phase, "exiting");
state = enter(exit(state));
assert.equal(state.displayed, arm);
state = select(state, null);
assert.equal(state.displayed, arm);
state = enter(exit(state));
assert.equal(state.displayed, null);
assert.equal(state.phase, "idle");

// Rapid clicks during an exit resolve to the most recent requested region.
state = select(select(select(initialSidebarState, chest), arm), neck);
state = enter(exit(state));
assert.equal(state.displayed, neck);
assert.equal(state.phase, "idle");

// A click during entry queues another complete exit/entry rather than flashing content.
state = exit(select(initialSidebarState, chest));
state = select(state, arm);
assert.equal(state.displayed, chest);
assert.equal(state.phase, "entering");
state = enter(state);
assert.equal(state.phase, "exiting");
state = enter(exit(state));
assert.equal(state.displayed, arm);
assert.equal(state.phase, "idle");

// Resetting during either phase returns to the widgets without a stale panel.
state = select(select(initialSidebarState, chest), null);
state = enter(exit(state));
assert.equal(state.displayed, null);
state = select(exit(select(initialSidebarState, chest)), null);
state = enter(exit(enter(state)));
assert.equal(state.displayed, null);
assert.equal(state.phase, "idle");
assert.equal(sidebarTransition(initialSidebarState, { type: "entry-complete" }), initialSidebarState);
assert.equal(sidebarTransition(initialSidebarState, { type: "exit-complete" }), initialSidebarState);

assert(back && back.meshKeys.includes("back_muscles_l") && back.meshKeys.includes("back_muscles_r"));
state = enter(exit(select(initialSidebarState, back)));
assert.equal(state.displayed, back, "Back selection must display its own muscle panel.");
assert.equal(state.phase, "idle");

assert.deepEqual(Object.keys(mockMuscleStatus).sort(), muscleGroups.map(({ key }) => key).sort());
for (const status of Object.values(mockMuscleStatus)) {
  for (const key of ["soreness", "fatigue", "strength", "endurance"]) {
    assert(Number.isInteger(status[key]) && status[key] >= 1 && status[key] <= 10);
  }
  assert(Number.isFinite(status.recoveryHours) && status.recoveryHours > 0);
}

console.log("Muscle data and sidebar transition checks passed.");
