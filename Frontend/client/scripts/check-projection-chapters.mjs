import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { chapterReducer, INITIAL_CHAPTER_STATE } from "../src/services/projectionChapters.js";

const select = (state, chapter) => chapterReducer(state, { type: "select", chapter });
const finish = state => chapterReducer(state, { type: "finish" });

// Entry starts empty, then opens only the right-hand chapter.
assert.equal(INITIAL_CHAPTER_STATE.active, null);
let state = finish(INITIAL_CHAPTER_STATE);
assert.equal(state.active, "activity");
assert.equal(state.phase, "open");

// The outgoing chapter must close before the incoming chapter can open.
state = select(state, "health");
assert.equal(state.active, null);
assert.equal(state.phase, "closing");
assert.equal(state.next, "health");
state = finish(state);
assert.equal(state.active, "health");
assert.equal(state.next, null);
assert.equal(select(state, "health"), state, "Clicking the open chapter must not reset it.");

// Rapid changes use the latest choice, including returning to the outgoing chapter.
state = select(state, "activity");
state = select(state, "health");
assert.equal(state.active, null);
assert.equal(finish(state).active, "health");
state = select(state, "activity");
assert.equal(finish(state).active, "activity");

// A manual choice during the entry delay must not be overridden by the entry timer.
state = select(INITIAL_CHAPTER_STATE, "health");
assert.equal(state.active, "health");
assert.equal(finish(state), state);

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
try {
  const { default: Chapters } = await server.ssrLoadModule("/src/components/ProjectionChapters.jsx");
  const markup = renderToStaticMarkup(React.createElement(Chapters, {
    health: React.createElement("h2", null, "Health content"),
    activity: React.createElement("input", { "aria-label": "Planning days", defaultValue: "14" })
  }));
  assert.equal((markup.match(/aria-expanded="false"/g) || []).length, 2);
  assert.equal((markup.match(/inert=""/g) || []).length, 2);
  assert.equal((markup.match(/aria-hidden="true" inert=""/g) || []).length, 2);
  for (const name of ["Health Intelligence", "Activity Intelligence", "Health content", "Planning days"]) {
    assert(markup.includes(name));
  }
  const controls = [...markup.matchAll(/aria-controls="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(controls).size, 2);
  for (const id of controls) assert(markup.includes(`id="${id}"`));
  console.log("Projection chapter checks passed: closed entry, right-side opening, sequential switching, rapid selections, manual entry override, and accessible inactive panels.");
} finally {
  await server.close();
}
