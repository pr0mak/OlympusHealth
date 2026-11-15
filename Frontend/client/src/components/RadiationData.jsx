import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { healthApi } from "../services/healthApi.js";
import {
  RADIATION_METRICS, formatRadiationValue, formatRadiationDate, getRadiationView
} from "../services/radiationData.js";

function RadiationChart({ rows, metric }) {
  const points = [...rows].map(row => ({
    ...row, time: new Date(String(row.recordedAt ?? "").replace(" ", "T")).getTime()
  })).filter(row => Number.isFinite(row.time)).sort((a, b) => a.time - b.time || a.id - b.id);
  if (!points.length) return <p className="radiation-notice">No recorded values for this metric.</p>;
  const values = points.map(point => point[metric.key]);
  const low = Math.min(...values), high = Math.max(...values);
  const padding = Math.max((high - low) * 0.15, 0.0001);
  const minimum = low - padding, maximum = high + padding;
  const first = points[0].time, last = points.at(-1).time;
  const x = point => first === last ? 420 : 62 + (point.time - first) / (last - first) * 718;
  const y = point => 230 - (point[metric.key] - minimum) / (maximum - minimum) * 200;
  const path = points.map((point, index) => `${index ? "L" : "M"}${x(point)},${y(point)}`).join(" ");
  return (
    <svg className="radiation-chart" viewBox="0 0 800 280" role="img"
      aria-label={`${metric.label}: ${points.length} recorded readings in ${metric.unit}`}>
      {(low === high ? [0.5] : [0, 0.5, 1]).map(fraction => {
        const value = low + (high - low) * fraction;
        const position = 230 - (value - minimum) / (maximum - minimum) * 200;
        return <g key={fraction}>
          <line x1="62" x2="780" y1={position} y2={position} stroke="currentColor" opacity=".13" strokeDasharray="4 6" />
          <text x="52" y={position + 4} textAnchor="end">{formatRadiationValue(value, metric.digits)}</text>
        </g>;
      })}
      {points.length > 1 && <path d={path} fill="none" stroke="#f6d45a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      {points.map(point => <circle key={point.id} cx={x(point)} cy={y(point)} r="4" fill="#f6d45a">
        <title>{`${formatRadiationDate(point.recordedAt)}: ${formatRadiationValue(point[metric.key], metric.digits)} ${metric.unit}`}</title>
      </circle>)}
      <text x="62" y="268">{String(points[0].recordedAt).slice(0, 10)}</text>
      <text x="780" y="268" textAnchor="end">{String(points.at(-1).recordedAt).slice(0, 10)}</text>
    </svg>
  );
}

export function RadiationReadings({ rows, username }) {
  const [metricKey, setMetricKey] = useState("dailyRadiationDose");
  const [range, setRange] = useState("30");
  const [showAll, setShowAll] = useState(false);
  const metric = RADIATION_METRICS.find(item => item.key === metricKey);
  const { sorted, latest, chartRows, stats } = useMemo(
    () => getRadiationView(rows, metricKey, range), [rows, metricKey, range]);
  return (
    <>
      <div className="radiation-account">
        <span>Profile <strong>{username}</strong></span>
        <span>Records <strong>{sorted.length}</strong></span>
        <span>Last record <strong>{formatRadiationDate(sorted[0]?.recordedAt)}</strong></span>
      </div>
      {!rows.length ? <p className="radiation-notice">No radiation measurements are stored for this account.</p> : (
        <>
          <div className="radiation-metrics">
            {RADIATION_METRICS.map(item => <button type="button" key={item.key}
              className="radiation-metric" aria-pressed={metricKey === item.key} onClick={() => setMetricKey(item.key)}>
              <span>{item.label}</span>
              <strong>{formatRadiationValue(latest[item.key]?.[item.key], item.digits)} <small>{item.unit}</small></strong>
              <small>{latest[item.key] ? formatRadiationDate(latest[item.key].recordedAt) : "No recorded value"}</small>
            </button>)}
          </div>
          <section className="radiation-section" aria-labelledby="radiation-trend-title">
            <div className="radiation-section-heading">
              <div><span className="radiation-kicker">RECORDED EXPOSURE</span><h3 id="radiation-trend-title">{metric.label}</h3></div>
              <label>History range <select aria-label="Radiation chart history range" value={range} onChange={event => setRange(event.target.value)}>
                <option value="7">Last 7 records</option><option value="30">Last 30 records</option><option value="all">All records</option>
              </select></label>
            </div>
            <RadiationChart rows={chartRows} metric={metric} />
            <div className="radiation-stats">
              {[["Average", stats?.average], ["Minimum", stats?.min], ["Maximum", stats?.max], ["Readings", stats?.count]].map(([label, value]) =>
                <div key={label}><span>{label}</span><strong>{formatRadiationValue(value, metric.digits)}
                  {value != null && label !== "Readings" && <small> {metric.unit}</small>}</strong></div>)}
            </div>
          </section>
          <section className="radiation-section" aria-labelledby="radiation-history-title">
            <div className="radiation-section-heading"><h3 id="radiation-history-title">Measurement history</h3><span>{sorted.length} records</span></div>
            <div className="radiation-table-scroll" tabIndex={0} role="region" aria-label="Radiation measurement history">
              <table><thead><tr><th>Recorded at</th>{RADIATION_METRICS.map(item => <th key={item.key}>{item.label} ({item.unit})</th>)}</tr></thead>
                <tbody>{(showAll ? sorted : sorted.slice(0, 10)).map(row => <tr key={row.id}>
                  <td>{formatRadiationDate(row.recordedAt)}</td>{RADIATION_METRICS.map(item =>
                    <td key={item.key}>{formatRadiationValue(row[item.key], item.digits)}</td>)}
                </tr>)}</tbody>
              </table>
            </div>
            {sorted.length > 10 && <button className="radiation-text-button" type="button" onClick={() => setShowAll(value => !value)}>
              {showAll ? "Show fewer records" : `Show all ${sorted.length} records`}
            </button>}
          </section>
          <p className="radiation-footnote">Values come from your recorded radiation measurements. Missing values are shown as —. Timestamps are displayed as stored.</p>
        </>
      )}
    </>
  );
}

export default function RadiationData() {
  const { user, token, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (authLoading || !userId || !token) return;
    let active = true;
    const controller = new AbortController();
    setResult(null);
    healthApi.getRadiationMeasurements(token, { signal: controller.signal }).then(response => {
      if (!response?.success || !Array.isArray(response.data)) throw new Error("Invalid radiation API response");
      if (active) setResult({ userId, token, rows: response.data });
    }).catch(error => {
      if (active) setResult({ userId, token, error: error.message || "Unable to load radiation records." });
    });
    return () => { active = false; controller.abort(); };
  }, [userId, token, authLoading, attempt]);
  const current = !authLoading && userId && token && result?.userId === userId && result?.token === token ? result : null;
  if (authLoading) return <p className="radiation-notice" role="status">Checking your session…</p>;
  if (!userId || !token) return <p className="radiation-notice">Please <Link to="/sign-in">sign in</Link> to view your radiation measurements.</p>;
  if (!current) return <p className="radiation-notice" role="status">Loading radiation measurements…</p>;
  if (current.error) return <div className="radiation-notice" role="alert"><p>{current.error}</p>
    <button type="button" className="radiation-text-button" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>;
  return <RadiationReadings key={userId} rows={current.rows} username={user.username} />;
}
