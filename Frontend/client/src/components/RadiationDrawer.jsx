import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import RadiationData from "./RadiationData.jsx";
import "./RadiationDrawer.css";

export default function RadiationDrawer() {
  const drawerRef = useRef(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const hasOpened = useRef(false);
  const [phase, setPhase] = useState("closed");
  const active = phase !== "closed";

  useLayoutEffect(() => {
    const navigation = document.querySelector(".site-header");
    if (!navigation) return;
    const updateGap = () => {
      drawerRef.current?.style.setProperty("--radiation-vertical-gap", `${navigation.getBoundingClientRect().height}px`);
    };
    updateGap();
    const observer = new ResizeObserver(updateGap);
    observer.observe(navigation);
    return () => observer.disconnect();
  }, []);

  const close = useCallback(() => setPhase(value => value === "closed" ? value : "closing"), []);
  const finishClose = useCallback(() => {
    const dialog = dialogRef.current;
    // Keep the same card on screen, returning it to a modeless edge drawer.
    dialog?.close();
    dialog?.show();
    setPhase("closed");
  }, []);

  function open() {
    if (phase !== "closed") return;
    hasOpened.current = true;
    // Promote the existing, partially visible card into the modal top layer.
    dialogRef.current.close();
    dialogRef.current.showModal();
    setPhase("opening");
  }

  useEffect(() => {
    if (phase !== "opening") return;
    closeRef.current?.focus({ preventScroll: true });
    // Preserve the edge position for a frame before moving this same card inward.
    let secondFrame;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setPhase("open"));
    });
    return () => { cancelAnimationFrame(firstFrame); if (secondFrame) cancelAnimationFrame(secondFrame); };
  }, [phase]);

  useEffect(() => {
    if (!active) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [active]);

  useEffect(() => {
    if (phase !== "closing") return;
    // Also complete when reduced motion skips the transition or it is interrupted.
    const timer = setTimeout(finishClose, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 640);
    return () => clearTimeout(timer);
  }, [phase, finishClose]);

  useEffect(() => {
    if (phase === "closed" && hasOpened.current) {
      triggerRef.current?.focus({ preventScroll: true });
      hasOpened.current = false;
    }
  }, [phase]);

  return (
    <div className="radiation-drawer" ref={drawerRef}>
      <dialog open id="radiation-dialog" className="radiation-dialog" ref={dialogRef} data-state={phase}
        aria-modal={active}
        aria-labelledby="radiation-title" onCancel={event => { event.preventDefault(); close(); }}
        onClick={event => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
        }}
        onTransitionEnd={event => {
          if (event.target === event.currentTarget && event.propertyName === "transform" && phase === "closing") finishClose();
        }}>
        <button className="radiation-tab" type="button" ref={triggerRef} onClick={active ? close : open}
          aria-haspopup="dialog" aria-expanded={active} aria-controls="radiation-dialog"
          aria-label={active ? "Close radiation exposure" : "Open radiation exposure"}>
          <span className="radiation-symbol" aria-hidden="true">☢</span><span>Radiation</span>
        </button>
        <div className="radiation-dialog-content" inert={!active} aria-hidden={!active}>
          <header className="radiation-dialog-header">
            <div className="radiation-dialog-heading"><span className="radiation-symbol" aria-hidden="true">☢</span>
              <div><span className="radiation-kicker">PERSONAL DOSIMETRY</span><h2 id="radiation-title">Radiation exposure</h2></div>
            </div>
            <button className="radiation-close" type="button" ref={closeRef} onClick={close} aria-label="Close radiation exposure">×</button>
          </header>
          {active && <RadiationData />}
        </div>
      </dialog>
    </div>
  );
}
