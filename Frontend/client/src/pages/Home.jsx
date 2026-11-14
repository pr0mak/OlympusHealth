
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
import { createProjection, heartRate } from "../data/mockHealth.js";

import "../styles/anatomy.css";

const AnatomyViewer = lazy(
  () => import("../components/anatomy/AnatomyViewer.jsx")
);

export default function Home() {
  const [selectedPart, setSelectedPart] = useState(null);
  const [assembled, setAssembled] = useState(false);

  const assemblePage = useCallback(() => {
    setAssembled(true);
  const assemblePage = useCallback(() => setAssembled(true), []);
  const clearSelection = useCallback(() => {
    setSelectedPart(null);
    document.getElementById("anatomy-viewport")?.focus({ preventScroll: true });
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

        <aside
          className="widget-stack"
          aria-label="Health and mission widgets"
        >
          {/* Health Data */}
          <Widget
            id="health-data"
            title="Health Data"
            to="/health-data"
          >
            <div className="preview-metric">
              <strong>
                72 <small>bpm</small>
              </strong>
              <span>Heart rate · Demo</span>
            </div>

            <TrendChart
              values={heartRate}
              label="Sample heart rate in beats per minute"
              compact
            />
          </Widget>

          {/* Future Projection */}
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

          {/* Alerts — separate page */}
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

        </aside>
        <OverviewSidebar
          selection={["muscles", "skeleton", "organs"].includes(selectedPart?.system) ? selectedPart : null}
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
