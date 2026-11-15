import AnatomyStatusPanel, { StatusScore } from "./AnatomyStatusPanel.jsx";
import { useAnatomyStatus } from "./useAnatomyStatus.js";

const metrics = [
  { key: "soreness", label: "Soreness" },
  { key: "fatigue", label: "Fatigue" },
  { key: "strength", label: "Strength" },
  { key: "endurance", label: "Endurance" }
];

export default function MuscleStatusPanel({ selection, onClear }) {
  const { data: status, loading, error } = useAnatomyStatus("muscles", selection?.key);
  return (
    <AnatomyStatusPanel selection={selection} kind="Muscle" onClear={onClear}>
      {loading ? <p className="anatomy-status-subtitle">Loading muscle measurements…</p>
        : error ? <p className="anatomy-status-subtitle" role="alert">{error}</p>
        : status ? <>
          <div className="anatomy-highlight">
            <span className="anatomy-highlight-label">Estimated recovery</span>
            <p><strong>{status.estimated_recovery ?? "—"}</strong> <span>hours</span></p>
            <span className="anatomy-highlight-caption">Stored estimate for selected muscle region</span>
          </div>
          <dl className="anatomy-metrics">
            {metrics.map(({ key, label }) => <StatusScore key={key} label={label} value={status[key] == null ? "—" : Number(status[key])} accent={key} />)}
          </dl>
          <p className="anatomy-status-footnote">Measurements for the selected muscle region and signed-in user. Demo seed values are not clinical measurements.</p>
        </> : <p className="anatomy-status-subtitle">No muscle data available for this account.</p>}
    </AnatomyStatusPanel>
  );
}
