import AnatomyStatusPanel, { StatusScore } from "./AnatomyStatusPanel.jsx";
import { useAnatomyStatus } from "./useAnatomyStatus.js";

export default function BoneStatusPanel({ selection, onClear }) {
  const { data: status, loading, error } = useAnatomyStatus("bones", selection?.key);
  return (
    <AnatomyStatusPanel selection={selection} kind="Bone" onClear={onClear}>
      {loading ? <p className="anatomy-status-subtitle">Loading bone measurements…</p>
        : error ? <p className="anatomy-status-subtitle" role="alert">{error}</p>
        : status ? <>
          <div className="anatomy-highlight">
            <span className="anatomy-highlight-label">Bone density</span>
            <p><strong>{status.bone_density == null ? "—" : Number(status.bone_density).toFixed(3)}</strong></p>
            <span className="anatomy-highlight-caption">Stored density for selected bone region · unit not specified</span>
          </div>
          <dl className="anatomy-metrics">
            <StatusScore label="Bone structure" value={status.bone_structure == null ? "—" : Number(status.bone_structure)} accent="structure" />
            <StatusScore label="Bone strength" value={status.bone_strength == null ? "—" : Number(status.bone_strength)} accent="strength" />
          </dl>
          <h3 className="bone-turnover-title">Bone turnover</h3>
          <p className="bone-turnover-caption">Building new bone and removing old bone.</p>
          <dl className="anatomy-metrics">
            <StatusScore label="Bone building" value={status.bone_building == null ? "—" : Number(status.bone_building)} accent="formation" />
            <StatusScore label="Bone breakdown" value={status.bone_breakdown == null ? "—" : Number(status.bone_breakdown)} accent="breakdown" />
          </dl>
          <p className="anatomy-status-footnote">Measurements for the selected bone region and signed-in user. Demo seed values are not clinical measurements.</p>
        </> : <p className="anatomy-status-subtitle">No bone data available for this account.</p>}
    </AnatomyStatusPanel>
  );
}
