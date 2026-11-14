export const initialSidebarState = {
  displayed: null,
  requested: null,
  phase: "idle",
  interacted: false,
};

const keyOf = (selection) => selection?.key ?? null;

export function sidebarTransition(state, action) {
  switch (action.type) {
    case "select": {
      const requested = action.selection ?? null;
      if (keyOf(requested) === keyOf(state.requested)) return state;
      return {
        ...state,
        requested,
        phase: state.phase === "idle" ? "exiting" : state.phase,
        interacted: true,
      };
    }
    case "exit-complete":
      if (state.phase !== "exiting") return state;
      // Resolve to the latest click, including a reset during the exit.
      return { ...state, displayed: state.requested, phase: "entering" };
    case "entry-complete":
      if (state.phase !== "entering") return state;
      return {
        ...state,
        phase: keyOf(state.displayed) === keyOf(state.requested) ? "idle" : "exiting",
      };
    default:
      return state;
  }
}
