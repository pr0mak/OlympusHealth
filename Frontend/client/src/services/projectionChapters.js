export const CHAPTER_SLIDE_MS = 560;
export const INITIAL_CHAPTER_STATE = { phase: "intro", active: null, next: "activity" };

export function chapterReducer(state, action) {
  if (action.type === "select") {
    if (state.active === action.chapter) return state;
    if (state.phase === "closing") return { ...state, next: action.chapter };
    if (!state.active) return { phase: "open", active: action.chapter, next: null };
    return { phase: "closing", active: null, next: action.chapter, outgoing: state.active };
  }
  if (action.type === "finish" && (state.phase === "intro" || state.phase === "closing")) {
    return { phase: "open", active: state.next, next: null };
  }
  return state;
}
