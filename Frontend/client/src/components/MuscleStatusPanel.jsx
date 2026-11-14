import { mockMuscleStatus } from "../data/mockMuscleStatus.js";

const metrics = [
  { key: "soreness", label: "Soreness" },
  { key: "fatigue", label: "Fatigue" },
  { key: "strength", label: "Strength" },
  { key: "endurance", label: "Endurance" },
];

export default function MuscleStatusPanel({ selection, onClear }) {
  const status = mockMuscleStatus[selection.key];

  return (
    <section className="muscle-status" aria-labelledby="muscle-status-title">
      <div className="muscle-status-topline">
        <span className="eyebrow">Muscle status</span>
        <span className="muscle-status-demo">Demo data</span>
      </div>
      <h2 id="muscle-status-title" aria-live="polite">{selection.label}</h2>
      <p className="muscle-status-subtitle">Current muscle condition</p>

      {status ? (
        <>
          <div className="muscle-recovery">
            <span className="muscle-recovery-label">Estimated recovery</span>
            <p><strong>{status.recoveryHours}</strong> <span>hours</span></p>
            <span className="muscle-recovery-caption">Until recovered · demo estimate</span>
          </div>
          <dl className="muscle-metrics">
            {metrics.map(({ key, label }) => (
              <div className={`muscle-metric muscle-metric--${key}`} key={key}>
                <dt>{label}</dt>
                <dd>{status[key]}<span> / 10</span></dd>
                <div className="muscle-metric-track" aria-hidden="true">
                  <span style={{ width: `${status[key] * 10}%` }} />
                </div>
              </div>
            ))}
          </dl>
          <p className="muscle-status-footnote">Fixed demo values for this muscle region.</p>
        </>
      ) : (
        <p className="muscle-status-subtitle">No muscle data available for this region.</p>
      )}

      <button className="muscle-status-back" type="button" onClick={onClear}>
        <span aria-hidden="true">←</span> Back to overview
      </button>
    </section>
  );
}
