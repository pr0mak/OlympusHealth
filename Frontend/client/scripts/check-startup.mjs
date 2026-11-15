import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import { createStartupSequence, STARTUP_TIMINGS } from "../src/components/startupSequence.js";

function testSequence(options = {}) {
  let now = 0;
  let id = 0;
  const timers = new Map();
  const phases = [];
  const sequence = createStartupSequence({
    ...options,
    onPhaseChange: phase => phases.push({ phase, time: now }),
    schedule(callback, delay) {
      const next = ++id;
      timers.set(next, { callback, time: now + delay });
      return next;
    },
    cancel: timer => timers.delete(timer),
  });
  return {
    sequence, phases, timers,
    advance(duration) {
      const end = now + duration;
      while (true) {
        const next = [...timers].filter(([, timer]) => timer.time <= end)
          .sort((a, b) => a[1].time - b[1].time)[0];
        if (!next) break;
        timers.delete(next[0]);
        now = next[1].time;
        next[1].callback();
      }
      now = end;
    },
  };
}

// Cached assets still allow the human and both orbits to form before site entry.
let run = testSequence();
run.sequence.setReady(true);
run.advance(STARTUP_TIMINGS.minimum - 1);
assert.deepEqual(run.phases, []);
run.advance(1);
assert.deepEqual(run.phases, [{ phase: "leaving", time: STARTUP_TIMINGS.minimum }]);
run.advance(STARTUP_TIMINGS.exit);
assert.deepEqual(run.phases.at(-1), { phase: "complete", time: STARTUP_TIMINGS.minimum + STARTUP_TIMINGS.exit });
assert.equal(run.timers.size, 0);

// A slower model continues loading after the logo's initial formation sequence.
run = testSequence();
run.advance(5000);
assert.deepEqual(run.phases, []);
run.sequence.setReady(true);
assert.equal(run.phases[0].time, 5000);
run.sequence.setReady(true);
run.advance(STARTUP_TIMINGS.exit);
assert.deepEqual(run.phases.map(({ phase }) => phase), ["leaving", "complete"]);

// Readiness can change while the account/model is being resolved.
run = testSequence();
run.sequence.setReady(true);
run.advance(500);
run.sequence.setReady(false);
run.advance(3000);
assert.deepEqual(run.phases, []);
run.sequence.setReady(true);
assert.equal(run.phases[0].time, 3500);
run.sequence.dispose();

// Broken requests/WebGL cannot leave the site permanently hidden.
run = testSequence();
run.advance(STARTUP_TIMINGS.maximum);
assert.equal(run.phases[0].phase, "leaving");
run.advance(STARTUP_TIMINGS.exit);
assert.equal(run.phases[1].phase, "complete");

// Unmount/StrictMode cleanup cancels every pending callback.
run = testSequence();
run.sequence.setReady(true);
run.sequence.dispose();
run.advance(30000);
assert.deepEqual(run.phases, []);
assert.equal(run.timers.size, 0);
run = testSequence({ minimum: 300, exit: 0 });
run.sequence.setReady(true);
run.advance(300);
assert.deepEqual(run.phases.map(({ phase }) => phase), ["leaving", "complete"]);

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
assert(index.includes('data-startup-state="loading"'));
assert(index.indexOf('id="startup-screen"') < index.indexOf('src="/src/main.jsx"'));
for (const asset of ["startup.css", "astra-loading.svg"]) {
  assert(index.includes(`%BASE_URL%brand/${asset}`));
  assert((await readFile(new URL(`../public/brand/${asset}`, import.meta.url))).length > 0);
}

// Verify the actual app starts hidden and non-interactive behind the static intro.
const oldStorage = globalThis.sessionStorage;
globalThis.sessionStorage = { getItem: () => null };
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
try {
  const { default: App } = await server.ssrLoadModule("/src/App.jsx");
  const { AuthProvider } = await server.ssrLoadModule("/src/context/AuthContext.jsx");
  const markup = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ["/sign-in"] },
    React.createElement(AuthProvider, null, React.createElement(App))));
  assert(markup.includes('class="site-content" inert="" aria-hidden="true"'));
  assert(markup.includes('class="orbital-background"'));
  assert(markup.includes('class="site-header'));
} finally {
  await server.close();
  if (oldStorage === undefined) delete globalThis.sessionStorage;
  else globalThis.sessionStorage = oldStorage;
}
console.log("Startup checks passed: formation timing, delayed assets, timeout, cleanup, reduced motion, boot assets and hidden app content.");
