import { useEffect, useId, useReducer, useRef } from "react";
import { CHAPTER_SLIDE_MS, INITIAL_CHAPTER_STATE, chapterReducer } from "../services/projectionChapters.js";
import "./ProjectionChapters.css";

const CHAPTERS = [
  { key: "health", title: "Health Intelligence", side: "left", symbol: "♡", color: "var(--health)" },
  { key: "activity", title: "Activity Intelligence", side: "right", symbol: "◈", color: "var(--violet)" }
];

export default function ProjectionChapters({ health, activity, ready = true }) {
  const [state, dispatch] = useReducer(chapterReducer, INITIAL_CHAPTER_STATE);
  const id = useId();
  const contentRefs = useRef({});
  const focusOnOpen = useRef(false);

  useEffect(() => {
    if (state.phase !== "intro" && state.phase !== "closing") return;
    if (state.phase === "intro" && !ready) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduced ? 0 : state.phase === "intro" ? 450 : CHAPTER_SLIDE_MS;
    const timer = window.setTimeout(() => dispatch({ type: "finish" }), delay);
    return () => window.clearTimeout(timer);
  }, [state.phase, ready]);

  useEffect(() => {
    if (!state.active || !focusOnOpen.current) return;
    contentRefs.current[state.active]?.focus({ preventScroll: true });
    focusOnOpen.current = false;
  }, [state.active]);

  return (
    <div className="fp-chapters" style={{ "--chapter-slide-duration": `${CHAPTER_SLIDE_MS}ms` }}>
      {CHAPTERS.map(chapter => {
        const active = state.active === chapter.key;
        const tabId = `${id}-${chapter.key}-tab`;
        const panelId = `${id}-${chapter.key}-panel`;
        return (
          <div
            className={`fp-chapter fp-chapter--${chapter.side}`}
            data-open={active}
            key={chapter.key}
            style={{ "--chapter-accent": chapter.color }}
          >
            <button
              type="button"
              className="fp-chapter-tab"
              id={tabId}
              aria-expanded={active}
              aria-controls={panelId}
              onClick={() => {
                if (active) return;
                focusOnOpen.current = true;
                dispatch({ type: "select", chapter: chapter.key });
              }}
            >
              <span className="fp-chapter-symbol" aria-hidden="true">{chapter.symbol}</span>
              <span className="fp-chapter-label">{chapter.title}</span>
              <span className="fp-chapter-direction" aria-hidden="true">
                {chapter.side === "left" ? (active ? "←" : "→") : (active ? "→" : "←")}
              </span>
            </button>
            <div
              className="fp-chapter-content"
              id={panelId}
              role="region"
              aria-labelledby={tabId}
              aria-hidden={!active}
              inert={!active}
              tabIndex={-1}
              ref={node => { contentRefs.current[chapter.key] = node; }}
            >
              {chapter.key === "health" ? health : activity}
            </div>
          </div>
        );
      })}
    </div>
  );
}
