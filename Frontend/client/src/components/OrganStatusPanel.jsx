import { mockOrganStatus } from "../data/mockOrganStatus.js";
import AnatomyStatusPanel, { StatusScore } from "./AnatomyStatusPanel.jsx";

export default function OrganStatusPanel({ selection, onClear }) {
  const status = mockOrganStatus[selection.key];

  return (
    <AnatomyStatusPanel selection={selection} kind="Organ" subtitle={status?.subtitle} onClear={onClear}>
      {status ? (
        <>
          <div className="anatomy-highlight organ-highlight">
            <span className="anatomy-highlight-label">{status.primary.label}</span>
            <p>
              <strong>{status.primary.value}</strong>{" "}
              {status.primary.unit && (
                <span className="organ-highlight-unit" data-long={status.primary.unit.length > 10}>
                  {status.primary.unit}
                </span>
              )}
            </p>
            <span className="anatomy-highlight-caption">
              {status.primary.caption || "Illustrative rating · demo value"}
            </span>
          </div>
          <dl className="anatomy-metrics organ-metrics">
            {status.metrics.map((metric, index) => metric.type === "score" ? (
              <StatusScore key={metric.label} {...metric} />
            ) : (
              <div
                className={`anatomy-metric organ-metric anatomy-metric--${index % 2 ? "structure" : "strength"}`}
                data-text={typeof metric.value === "string"}
                key={metric.label}
              >
                <dt>{metric.label}</dt>
                <dd>{metric.value}{metric.unit && <span>{metric.unit}</span>}</dd>
              </div>
            ))}
          </dl>
          <p className="anatomy-status-footnote">{status.note}</p>
        </>
      ) : (
        <p className="anatomy-status-subtitle">No organ data available for this region.</p>
      )}
    </AnatomyStatusPanel>
  );
}
