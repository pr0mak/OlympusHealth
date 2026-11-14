import { mockMuscleStatus } from "../data/mockMuscleStatus.js";
import AnatomyStatusPanel, { StatusScore } from "./AnatomyStatusPanel.jsx";

const metrics = [
  { key: "soreness", label: "Soreness" },
  { key: "fatigue", label: "Fatigue" },
  { key: "strength", label: "Strength" },
  { key: "endurance", label: "Endurance" },
];

export default function MuscleStatusPanel({ selection, onClear }) {
  const status = mockMuscleStatus[selection.key];

  return (
    <AnatomyStatusPanel selection={selection} kind="Muscle" onClear={onClear}>
      {status ? (
        <>
          <div className="anatomy-highlight">
            <span className="anatomy-highlight-label">Estimated recovery</span>
            <p><strong>{status.recoveryHours}</strong> <span>hours</span></p>
            <span className="anatomy-highlight-caption">Until recovered · demo estimate</span>
          </div>
          <dl className="anatomy-metrics">
            {metrics.map(({ key, label }) => (
              <StatusScore key={key} label={label} value={status[key]} accent={key} />
            ))}
          </dl>
          <p className="anatomy-status-footnote">Fixed demo values for this muscle region.</p>
        </>
      ) : (
        <p className="anatomy-status-subtitle">No muscle data available for this region.</p>
      )}
    </AnatomyStatusPanel>
  );
}
