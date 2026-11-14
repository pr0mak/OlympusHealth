import { mockBoneStatus } from "../data/mockBoneStatus.js";
import AnatomyStatusPanel, { StatusScore } from "./AnatomyStatusPanel.jsx";

export default function BoneStatusPanel({ selection, onClear }) {
  const status = mockBoneStatus[selection.key];

  return (
    <AnatomyStatusPanel selection={selection} kind="Bone" onClear={onClear}>
      {status ? (
        <>
          <div className="anatomy-highlight">
            <span className="anatomy-highlight-label">Bone density</span>
            <p><strong>{status.density.toFixed(3)}</strong> <span>g/cm²</span></p>
            <span className="anatomy-highlight-caption">Mineral density · demo value</span>
          </div>
          <dl className="anatomy-metrics">
            <StatusScore label="Bone structure" value={status.structure} accent="structure" />
            <StatusScore label="Bone strength" value={status.strength} accent="strength" />
          </dl>
          <h3 className="bone-turnover-title">Bone turnover</h3>
          <p className="bone-turnover-caption">Building new bone and removing old bone.</p>
          <dl className="anatomy-metrics">
            <StatusScore label="Bone building" value={status.formation} accent="formation" />
            <StatusScore label="Bone breakdown" value={status.breakdown} accent="breakdown" />
          </dl>
          <p className="anatomy-status-footnote">
            Fixed demo values. Structure, strength and turnover use illustrative 1–10 scores.
          </p>
        </>
      ) : (
        <p className="anatomy-status-subtitle">No bone data available for this region.</p>
      )}
    </AnatomyStatusPanel>
  );
}
