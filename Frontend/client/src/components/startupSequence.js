export const STARTUP_TIMINGS = { minimum: 2600, maximum: 15000, exit: 420 };

// Asset readiness and the logo sequence are independent: finish both before entry.
export function createStartupSequence({
  onPhaseChange,
  minimum = STARTUP_TIMINGS.minimum,
  maximum = STARTUP_TIMINGS.maximum,
  exit = STARTUP_TIMINGS.exit,
  schedule = setTimeout,
  cancel = clearTimeout,
}) {
  let phase = "loading";
  let ready = false;
  let minimumElapsed = false;
  let disposed = false;
  const timers = new Set();
  function later(callback, delay) {
    const timer = schedule(() => {
      timers.delete(timer);
      if (!disposed) callback();
    }, delay);
    timers.add(timer);
  }
  function leave() {
    if (disposed || phase !== "loading") return;
    timers.forEach(cancel);
    timers.clear();
    phase = "leaving";
    onPhaseChange(phase);
    later(() => {
      phase = "complete";
      onPhaseChange(phase);
    }, exit);
  }
  later(() => {
    minimumElapsed = true;
    if (ready) leave();
  }, minimum);
  // An unavailable model, WebGL, or backend must not trap the user on the intro.
  later(leave, maximum);

  return {
    setReady(value) {
      ready = Boolean(value);
      if (ready && minimumElapsed) leave();
    },
    dispose() {
      disposed = true;
      timers.forEach(cancel);
      timers.clear();
    },
  };
}
