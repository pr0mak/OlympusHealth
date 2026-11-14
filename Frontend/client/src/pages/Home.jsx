import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import Widget from "../components/Widget.jsx";
import HealthDataPreview from "../components/HealthDataPreview.jsx";
import OverviewSidebar from "../components/OverviewSidebar.jsx";
import TrendChart from "../components/TrendChart.jsx";
import { createProjection } from "../data/mockHealth.js";
import "../styles/anatomy.css";

const AnatomyViewer = lazy(
  () => import("../components/anatomy/AnatomyViewer.jsx"),
);

export default function Home() {
  const [selectedPart, setSelectedPart] = useState(null);
  const [assembled, setAssembled] = useState(false);
  const assemblePage = useCallback(() => setAssembled(true), []);
  const clearSelection = useCallback(() => {
    setSelectedPart(null);
    document.getElementById("anatomy-viewport")?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (assembled) return;
    // Keep the overview usable even when the model is slow or cannot load.
    const fallback = window.setTimeout(assemblePage, 1800);
    return () => window.clearTimeout(fallback);
  }, [assembled, assemblePage]);
  return (
    <main className="dashboard home-overview" data-assembled={assembled} id="main-content" tabIndex={-1}>
      <div className="dashboard-grid">
        <Suspense
          fallback={
            <section
              className="anatomy-viewer"
              aria-label="Loading anatomy viewer"
            />
          }
        >
          <AnatomyViewer
            onModelReady={assemblePage}
            selected={selectedPart?.key ?? null}
            onSelectionChange={setSelectedPart}
          />
        </Suspense>
        <OverviewSidebar
          selection={selectedPart?.system === "muscles" ? selectedPart : null}
          onClear={clearSelection}
        >
          <div className="widget-stack">
            <Widget id="health-data" title="Health Data" to="/health-data">
              <HealthDataPreview />
            </Widget>
            <Widget
              id="mission-assistant"
              title="Mission Assistant"
              to="/mission-assistant"
            >
              <p className="preview-title">Your mission workspace</p>
              <p className="preview-copy">
                Review your daily check-in and explore your health overview.
              </p>
            </Widget>
            <Widget
              id="future-projection"
              title="Future Projection"
              to="/future-projection"
            >
              <div className="preview-metric">
                <strong>
                  7 <small>days</small>
                </strong>
                <span>Illustrative outlook</span>
              </div>
              <TrendChart
                values={createProjection()}
                label="Illustrative activity index"
                compact
              />
            </Widget>
          </div>
        </OverviewSidebar>
      </div>
    </main>
  );
}
