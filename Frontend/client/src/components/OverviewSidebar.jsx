import { useEffect, useReducer } from "react";
import MuscleStatusPanel from "./MuscleStatusPanel.jsx";
import BoneStatusPanel from "./BoneStatusPanel.jsx";
import OrganStatusPanel from "./OrganStatusPanel.jsx";
import { initialSidebarState, sidebarTransition } from "./sidebarTransition.js";
import "../styles/anatomy-status.css";

const panels = {
  muscles: { component: MuscleStatusPanel, kind: "muscle" },
  skeleton: { component: BoneStatusPanel, kind: "bone" },
  organs: { component: OrganStatusPanel, kind: "organ" },
};

export default function OverviewSidebar({ selection, onClear, children }) {
  const [state, dispatch] = useReducer(sidebarTransition, initialSidebarState);
  const { component: Panel, kind } = panels[state.displayed?.system] ?? panels.muscles;

  useEffect(() => {
    dispatch({ type: "select", selection });
  }, [selection]);

  function finishAnimation(event) {
    // Ignore the overview widgets' own entrance animations.
    if (event.target !== event.currentTarget) return;
    if (event.animationName === "sidebar-exit") {
      dispatch({ type: "exit-complete" });
    } else if (event.animationName === "sidebar-enter") {
      dispatch({ type: "entry-complete" });
    }
  }

  return (
    <aside
      className="overview-sidebar"
      data-phase={state.phase}
      data-interacted={state.interacted}
      aria-label={state.displayed ? `${state.displayed.label} ${kind} information` : "Health and mission widgets"}
      aria-busy={state.phase !== "idle"}
      onKeyDown={(event) => {
        if (event.key === "Escape" && selection) onClear();
      }}
    >
      <div
        className="sidebar-surface"
        onAnimationEnd={finishAnimation}
        inert={state.phase === "exiting"}
      >
        {/* Keep the real health widget mounted so swaps preserve its data. */}
        <div className="sidebar-view" hidden={Boolean(state.displayed)}>
          {children}
        </div>
        {state.displayed && (
          <Panel
            key={state.displayed.key}
            selection={state.displayed}
            onClear={onClear}
          />
        )}
      </div>
    </aside>
  );
}
