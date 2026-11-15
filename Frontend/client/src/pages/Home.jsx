import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState
} from "react";

import Widget from "../components/Widget.jsx";
import HealthDataPreview from "../components/HealthDataPreview.jsx";
import AlertsPreview from "../components/AlertsPreview.jsx";
import OverviewSidebar from "../components/OverviewSidebar.jsx";
import TrendChart from "../components/TrendChart.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getAnatomy } from "../data/anatomy.js";

import { createProjection } from "../data/mockHealth.js";

import "../styles/anatomy.css";

const AnatomyViewer = lazy(
  () => import("../components/anatomy/AnatomyViewer.jsx")
);

export default function Home({ onStartupReady }) {
  const { user, loading: authLoading } = useAuth();
  const anatomy = getAnatomy(user?.gender);
  const modelIdentity = `${user?.id ?? "guest"}:${anatomy.sex}`;
  const [selection, setSelection] = useState(null);
  // Account/model changes clear focus immediately, before another model renders.
  const selectedPart = !authLoading && selection?.owner === modelIdentity ? selection.part : null;
  const selectPart = useCallback(part => {
    setSelection({ owner: modelIdentity, part });
  }, [modelIdentity]);
  useEffect(() => { setSelection(null); }, [modelIdentity]);
  const [assembled, setAssembled] = useState(false);

  const assemblePage = useCallback(() => {
    setAssembled(true);
  }, []);
  const finishModelLoading = useCallback(() => {
    assemblePage();
    onStartupReady?.();
  }, [assemblePage, onStartupReady]);

  const clearSelection = useCallback(() => {
    setSelection(null);

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
          {authLoading ? (
            <section className="anatomy-viewer" aria-label="Loading anatomy viewer" aria-busy="true" />
          ) : (
            <AnatomyViewer
              key={modelIdentity}
              gender={user?.gender}
              onModelReady={finishModelLoading}
              onModelError={finishModelLoading}
              selected={selectedPart?.key ?? null}
              onSelectionChange={selectPart}
            />
          )}
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

             {/* ALERTS */}
            <Widget
              id="alerts"
              title="Alerts"
              to="/alerts"
            >
              <AlertsPreview />
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

          </div>
        </OverviewSidebar>

      </div>
    </main>
  );
}
