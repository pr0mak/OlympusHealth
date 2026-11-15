import AnatomyStatusPanel, { StatusScore } from "./AnatomyStatusPanel.jsx";
import { useAnatomyStatus } from "./useAnatomyStatus.js";

const definitions = {
  brain: { title: "Cognition and mental comfort", fields: [
    ["reaction_time", "Reaction time", "ms"], ["concentration", "Concentration", "/ 10", true], ["memory", "Memory", "/ 10", true], ["mental_fatigue", "Mental fatigue", "/ 10", true], ["headache", "Headache", "/ 10", true]] },
  heart: { title: "Heart and circulation", fields: [
    ["heart_rate", "Heart rate", "bpm"], ["heart_rhythm", "Heart rhythm", ""], ["blood_pressure", "Blood pressure", "mmHg"], ["blood_oxygen", "Blood oxygen", "%"], ["chest_discomfort", "Chest discomfort", "/ 10", true]] },
  lungs: { title: "Breathing and oxygen delivery", fields: [
    ["blood_oxygen", "Blood oxygen", "%"], ["breathing_rate", "Breathing rate", "breaths/min"], ["lung_capacity", "Lung capacity", "L"], ["breathlessness", "Breathlessness", "/ 10", true], ["breathing_comfort", "Breathing comfort", "/ 10", true]] },
  liver: { title: "Liver-related measurements", fields: [
    ["alt_enzyme", "ALT (liver enzyme)", "U/L"], ["ast_enzyme", "AST (enzyme)", "U/L"], ["bilirubin", "Bilirubin", "mg/dL"], ["albumin", "Albumin (protein)", "g/dL"], ["upper_abdominal_comfort", "Upper abdominal comfort", "/ 10", true]] },
  kidneys: { title: "Kidney filtration and urinary health", fields: [
    ["kidney_filtration_egfr", "Kidney filtration (eGFR)", "mL/min/1.73 m²"], ["creatinine", "Creatinine (blood)", "mg/dL"], ["total_daily_urine", "Total daily urine", "L/day"], ["protein_in_urine", "Protein in urine", ""], ["flank_discomfort", "Flank discomfort", "/ 10", true]] },
  small_intestine: { title: "Digestion and abdominal comfort", fields: [
    ["digestive_comfort", "Digestive comfort", "/ 10", true], ["food_tolerance", "Food tolerance", "/ 10", true], ["abdominal_bloating", "Abdominal bloating", "/ 10", true], ["abdominal_cramps", "Abdominal cramps", "/ 10", true], ["nausea", "Nausea", "/ 10", true]] }
};
const organTable = {
  brain: "brain", heart: "heart", lung_l: "lungs", lung_r: "lungs", liver: "liver",
  kidney_l: "kidneys", kidney_r: "kidneys", small_intestine: "small_intestine"
};

function OrganContent({ table, organKey }) {
  const { data, loading, error } = useAnatomyStatus("organs", organKey);
  const definition = definitions[table];
  if (loading) return <p className="anatomy-status-subtitle">Loading organ measurements…</p>;
  if (error) return <p className="anatomy-status-subtitle" role="alert">{error}</p>;
  if (!data) return <p className="anatomy-status-subtitle">No organ data available for this account.</p>;
  const [primary, ...metrics] = definition.fields;
  const valueOf = key => data[key] == null ? "—" : String(data[key]);
  return <>
    <div className="anatomy-highlight organ-highlight">
      <span className="anatomy-highlight-label">{primary[1]}</span>
      <p><strong>{valueOf(primary[0])}</strong>{primary[2] && <span className="organ-highlight-unit" data-long={primary[2].length > 10}> {primary[2]}</span>}</p>
      <span className="anatomy-highlight-caption">Stored measurement · account data</span>
    </div>
    <dl className="anatomy-metrics organ-metrics">
      {metrics.map(([key, label, unit, isScore], index) => isScore ?
        <StatusScore key={key} label={label} value={data[key] == null ? "—" : Number(data[key])} accent={key.includes("fatigue") || key.includes("discomfort") || key.includes("nausea") || key.includes("bloating") || key.includes("cramps") || key.includes("breathlessness") || key.includes("headache") ? "soreness" : "strength"} /> :
        <div className={`anatomy-metric organ-metric anatomy-metric--${index % 2 ? "structure" : "strength"}`} data-text={typeof data[key] === "string"} key={key}>
          <dt>{label}</dt><dd>{valueOf(key)}{unit && <span> {unit}</span>}</dd>
        </div>)}
    </dl>
    <p className="anatomy-status-footnote">Account-level stored data. Shared measurements apply to both left and right organs. Test records are not clinical assessments.</p>
  </>;
}

export default function OrganStatusPanel({ selection, onClear }) {
  const table = organTable[selection.key];
  return <AnatomyStatusPanel selection={selection} kind="Organ" subtitle={table ? definitions[table].title : undefined} onClear={onClear}>
    {table ? <OrganContent key={selection.key} table={table} organKey={selection.key} /> : <p className="anatomy-status-subtitle">No database-backed measurements for this organ yet.</p>}
  </AnatomyStatusPanel>;
}
