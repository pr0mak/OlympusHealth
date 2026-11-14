
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState
} from "react";

import Widget from "../components/Widget.jsx";
import HealthDataPreview from "../components/HealthDataPreview.jsx";
import OverviewSidebar from "../components/OverviewSidebar.jsx";
import TrendChart from "../components/TrendChart.jsx";

import { createProjection } from "../data/mockHealth.js";

import "../styles/anatomy.css";

const AnatomyViewer = lazy(
  () => import("../components/anatomy/AnatomyViewer.jsx")
);

export default function Home() {
  const [selectedPart, setSelectedPart] = useState(null);
  const [assembled, setAssembled] = useState(false);

  const assemblePage = useCallback(() => {
    setAssembled(true);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPart(null);

    document
      .getElementById("anatomy-viewport")
      ?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (assembled) return;

    const fallback = window.setTimeout(
      assemblePage,
      1800
    );

    return () => window.clearTimeout(fallback);
  }, [assembled, assemblePage]);

  return (
    <main
      className="dashboard home-overview"
      data-assembled={assembled}
      id="main-content"
      tabIndex={-1}
    >
      <div className="dashboard-grid">

        {/* 3D ANATOMY VIEWER */}
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

        {/* RIGHT SIDEBAR */}
        <OverviewSidebar
          selection={
            ["muscles", "skeleton", "organs"].includes(
              selectedPart?.system
            )
              ? selectedPart
              : null
          }
          onClear={clearSelection}
        >
          <div
            className="widget-stack"
            aria-label="Health and mission widgets"
          >

            {/* HEALTH DATA */}
            <Widget
              id="health-data"
              title="Health Data"
              to="/health-data"
            >
              <HealthDataPreview />
            </Widget>

            {/* MISSION ASSISTANT */}
            <Widget
              id="mission-assistant"
              title="Mission Assistant"
              to="/mission-assistant"
            >
              <p className="preview-title">
                Your mission workspace
              </p>

              <p className="preview-copy">
                Review your daily check-in and explore
                your health overview.
              </p>
            </Widget>

            {/* FUTURE PROJECTION */}
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

            {/* ALERTS */}
            <Widget
              id="alerts"
              title="Alerts"
              to="/alerts"
            >
              <div className="alerts-widget-preview">
                <p>
                  Review health observations and alerts
                  based on your recorded data.
                </p>

                <span className="alerts-widget-preview-link">
                  View alerts →
                </span>
              </div>
            </Widget>

          </div>
        </OverviewSidebar>

      </div>
    </main>
  );
}
