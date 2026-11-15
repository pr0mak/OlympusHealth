import { useEffect, useRef, useState } from "react";
import { createStartupSequence } from "./startupSequence.js";

export default function useStartupIntro(ready) {
  const [phase, setPhase] = useState("loading");
  const sequence = useRef(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.dataset.startupState = "loading";
    const controller = createStartupSequence({
      ...(reducedMotion ? { minimum: 300, exit: 0 } : {}),
      onPhaseChange(nextPhase) {
        document.documentElement.dataset.startupState = nextPhase;
        setPhase(nextPhase);
      },
    });
    sequence.current = controller;
    return () => {
      controller.dispose();
      sequence.current = null;
    };
  }, []);

  useEffect(() => { sequence.current?.setReady(ready); }, [ready]);
  return phase;
}
