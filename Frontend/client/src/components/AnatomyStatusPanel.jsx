import BackLink from "./BackLink.jsx";

export default function AnatomyStatusPanel({ selection, kind, subtitle, onClear, children }) {
  return (
    <section className="anatomy-status" aria-labelledby="anatomy-status-title">
      <div className="anatomy-status-topline">
        <span className="eyebrow">{kind} status</span>
      </div>
      <h2 id="anatomy-status-title" aria-live="polite">{selection.label}</h2>
      <p className="anatomy-status-subtitle">{subtitle || `Current ${kind.toLowerCase()} condition`}</p>
      {children}
      <BackLink onClick={onClear} />
    </section>
  );
}

export function StatusScore({ label, value, accent }) {
  const score = typeof value === "number" && Number.isFinite(value) ? value : null;
  return (
    <div className={`anatomy-metric anatomy-metric--${accent}`}>
      <dt>{label}</dt>
      <dd>{score ?? "—"}<span> / 10</span></dd>
      <div className="anatomy-metric-track" aria-hidden="true">
        <span style={{ width: `${score == null ? 0 : Math.max(0, Math.min(10, score)) * 10}%` }} />
      </div>
    </div>
  );
}
