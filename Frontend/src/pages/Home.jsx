import { lazy, Suspense, useState } from "react";
import Widget from "../components/Widget.jsx";
import TrendChart from "../components/TrendChart.jsx";
import { createProjection, heartRate } from "../data/mockHealth.js";

const AnatomyViewer = lazy(
  () => import("../components/anatomy/AnatomyViewer.jsx"),
);

export default function Home() {
  const [selectedPart, setSelectedPart] = useState(null);
  return (
    <main className="dashboard" id="main-content" tabIndex={-1}>
      <div className="dashboard-grid">
        <Suspense
          fallback={
            <section
              className="viewer-panel"
              aria-label="Loading anatomy viewer"
            />
          }
        >
          <AnatomyViewer onSelectionChange={setSelectedPart} />
        </Suspense>
        <aside className="widget-stack" aria-label="Health and mission widgets">
          <Widget id="health-data" title="Health Data" to="/health-data">
            {selectedPart && (
              <p className="selected-part-preview">
                Selected structure: {selectedPart.label}
              </p>
            )}
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
        </aside>
      </div>
    </main>
  );
}
