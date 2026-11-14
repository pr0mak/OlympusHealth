
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { healthApi } from "../services/healthApi.js";
import "./HealthData.css";

const METRICS = [
  {
    key: "heartRate",
    label: "Heart Rate",
    unit: "bpm",
    description: "Recorded average heart rate",
    color: "#38bdf8"
  },
  {
    key: "oxygenSaturation",
    label: "Oxygen Saturation",
    unit: "%",
    description: "Recorded blood oxygen saturation",
    color: "#34d399"
  },
  {
    key: "bodyTemperature",
    label: "Body Temperature",
    unit: "°C",
    description: "Recorded body temperature",
    color: "#fbbf24"
  },
  {
    key: "sleepHours",
    label: "Sleep Duration",
    unit: "h",
    description: "Recorded sleep duration",
    color: "#a78bfa"
  }
];

const RANGES = [
  { value: "7", label: "Last 7 records" },
  { value: "30", label: "Last 30 records" },
  { value: "all", label: "All records" }
];

function formatValue(value, digits = 2) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", {
        maximumFractionDigits: digits
      })
    : "—";
}

function formatDate(value) {
  if (!value) return "Unknown date";
  return String(value).replace("T", " ");
}

function toTime(value) {
  if (!value) return NaN;
  const time = new Date(
    String(value).replace(" ", "T")
  ).getTime();
  return Number.isFinite(time) ? time : NaN;
}

function calculateStats(rows, key) {
  const values = rows
    .map(row => row[key])
    .filter(value => value != null)
    .map(Number)
    .filter(Number.isFinite);

  if (values.length === 0) {
    return null;
  }

  return {
    count: values.length,
    average: values.reduce((a, b) => a + b, 0)
      / values.length,
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

function MetricCard({ metric, row, selected, onClick }) {
  const value = row?.[metric.key];

  return (
    <button
      type="button"
      className={`health-metric-card ${
        selected ? "health-metric-card--active" : ""
      }`}
      style={{ "--metric-color": metric.color }}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="health-metric-label">
        {metric.label}
      </span>

      <span className="health-metric-value">
        {formatValue(value)}
        <small>{metric.unit}</small>
      </span>

      <span className="health-metric-detail">
        {row
          ? `Recorded: ${formatDate(row.recordedAt)}`
          : "No recorded value"}
      </span>

      <span className="health-metric-action">
        View trend ↗
      </span>
    </button>
  );
}

// SVG chart using only recorded measurements.
// Horizontal spacing follows actual timestamps.
function HealthLineChart({ rows, metric }) {
  const points = useMemo(() => {
    return rows
      .filter(row => row[metric.key] != null)
      .map(row => ({
        id: row.id,
        time: toTime(row.recordedAt),
        label: formatDate(row.recordedAt),
        value: Number(row[metric.key])
      }))
      .filter(point =>
        Number.isFinite(point.time) &&
        Number.isFinite(point.value)
      )
      .sort((a, b) => a.time - b.time);
  }, [rows, metric.key]);

  if (points.length === 0) {
    return (
      <div className="health-chart-empty">
        No recorded values for this metric.
      </div>
    );
  }

  const W = 760;
  const H = 290;
  const left = 52;
  const right = 20;
  const top = 24;
  const bottom = 45;

  const plotW = W - left - right;
  const plotH = H - top - bottom;

  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const padding = Math.max((max - min) * 0.15, 0.5);
  const yMin = min - padding;
  const yMax = max + padding;

  const tMin = points[0].time;
  const tMax = points[points.length - 1].time;

  const x = p => (
    tMin === tMax
      ? left + plotW / 2
      : left + ((p.time - tMin) / (tMax - tMin)) * plotW
  );

  const y = value => (
    top + plotH -
    ((value - yMin) / (yMax - yMin)) * plotH
  );

  const path = points.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${x(p)} ${y(p.value)}`
  ).join(" ");

  const ticks = Array.from(
    { length: 5 },
    (_, i) => yMin + (yMax - yMin) * i / 4
  );

  return (
    <div className="health-chart-container">
      <svg
        className="health-svg-chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${metric.label}: ${points.length} recorded readings`}
      >
        {ticks.map((tick, i) => (
          <g key={i}>
            <line
              x1={left}
              y1={y(tick)}
              x2={W - right}
              y2={y(tick)}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeDasharray="4 6"
            />
            <text
              x={left - 10}
              y={y(tick) + 4}
              textAnchor="end"
              fill="currentColor"
              fontSize="12"
              opacity="0.7"
            >
              {formatValue(tick, 1)}
            </text>
          </g>
        ))}

        {points.length > 1 && (
          <path
            d={path}
            fill="none"
            stroke={metric.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map((point, i) => (
          <circle
            key={`${point.id}-${i}`}
            cx={x(point)}
            cy={y(point.value)}
            r="4"
            fill={metric.color}
            stroke="#101b2a"
            strokeWidth="1.5"
          >
            <title>
              {`${point.label}: ${point.value} ${metric.unit}`}
            </title>
          </circle>
        ))}

        <text
          x={left}
          y={H - 10}
          fill="currentColor"
          opacity="0.7"
          fontSize="12"
        >
          {points[0].label.slice(0, 10)}
        </text>

        <text
          x={W - right}
          y={H - 10}
          textAnchor="end"
          fill="currentColor"
          opacity="0.7"
          fontSize="12"
        >
          {points[points.length - 1].label.slice(0, 10)}
        </text>
      </svg>

      <p className="health-chart-caption">
        {points.length} recorded reading(s).
        Points use actual recorded timestamps.
        Hover over a point to inspect its value.
      </p>
    </div>
  );
}

export default function HealthData() {
  const {
    user,
    token,
    loading: authLoading
  } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [metricKey, setMetricKey] = useState("heartRate");
  const [range, setRange] = useState("30");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !token) {
      setRows([]);
      setError("");
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setRows([]);

      try {
        const response = await healthApi.getMeasurements(token);

        if (!response.success || !Array.isArray(response.data)) {
          throw new Error("Invalid health API response");
        }

        if (active) {
          setRows(response.data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load health data");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [user?.id, token, authLoading]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) =>
      toTime(b.recordedAt) - toTime(a.recordedAt)
    );
  }, [rows]);

  const activeMetric = METRICS.find(
    metric => metric.key === metricKey
  ) || METRICS[0];

  // Every metric can have a different latest recorded value.
  const latestByMetric = useMemo(() => {
    return Object.fromEntries(
      METRICS.map(metric => [
        metric.key,
        sortedRows.find(row =>
          row[metric.key] !== null &&
          row[metric.key] !== undefined
        ) || null
      ])
    );
  }, [sortedRows]);

  const chartRows = useMemo(() => {
    const eligible = sortedRows.filter(
      row => row[metricKey] != null
    );

    if (range === "all") return eligible;

    return eligible.slice(0, Number(range));
  }, [sortedRows, metricKey, range]);

  const stats = useMemo(
    () => calculateStats(chartRows, metricKey),
    [chartRows, metricKey]
  );

  const displayedRows = showAll
    ? sortedRows
    : sortedRows.slice(0, 10);

  return (
    <main
      className="dashboard detail-page astra-health-page"
      id="main-content"
      tabIndex={-1}
    >
      <Link to="/" className="back-link">
        ← Back to overview
      </Link>

      <div className="health-page-heading">
        <div>
          <p className="health-eyebrow">
            ASTRA / PERSONAL HEALTH MONITORING
          </p>

          <h1>Health Data</h1>

          <p className="health-description">
            Explore recorded physiological measurements,
            trends and historical data.
          </p>
        </div>
      </div>

      {authLoading ? (
        <div className="health-notice">
          Checking your session...
        </div>
      ) : !user || !token ? (
        <div className="health-notice">
          Please <Link to="/sign-in">sign in</Link> to
          access your measurements.
        </div>
      ) : (
        <>
          <section className="health-account-strip">
            <div>
              <span className="health-eyebrow">
                ACTIVE ASTRONAUT PROFILE
              </span>
              <strong>{user.username}</strong>
            </div>

            <div>
              <span className="health-eyebrow">
                TOTAL RECORDS
              </span>
              <strong>
                {loading ? "…" : sortedRows.length}
              </strong>
            </div>

            <div>
              <span className="health-eyebrow">
                LAST RECORD
              </span>
              <strong>
                {sortedRows.length
                  ? formatDate(sortedRows[0].recordedAt)
                  : "Not available"}
              </strong>
            </div>
          </section>

          {loading && (
            <div className="health-notice">
              Loading health measurements...
            </div>
          )}

          {error && (
            <div className="health-notice health-error" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && sortedRows.length === 0 && (
            <div className="health-notice">
              No health measurements are stored for
              this account.
            </div>
          )}

          {!loading && !error && sortedRows.length > 0 && (
            <>
              <section className="health-section">
                <div className="health-section-heading">
                  <div>
                    <span className="health-eyebrow">
                      LATEST AVAILABLE READINGS
                    </span>
                    <h2>Health Overview</h2>
                  </div>
                  <span className="health-muted">
                    Select a card to explore its history
                  </span>
                </div>

                <div className="health-metrics-grid">
                  {METRICS.map(metric => (
                    <MetricCard
                      key={metric.key}
                      metric={metric}
                      row={latestByMetric[metric.key]}
                      selected={metricKey === metric.key}
                      onClick={() => setMetricKey(metric.key)}
                    />
                  ))}
                </div>
              </section>

              <section className="health-section health-panel">
                <div className="health-section-heading">
                  <div>
                    <span className="health-eyebrow">
                      HISTORICAL ANALYTICS
                    </span>
                    <h2>{activeMetric.label} Trend</h2>
                    <p className="health-muted">
                      {activeMetric.description}
                    </p>
                  </div>

                  <select
                    className="health-select"
                    aria-label="Chart time range"
                    value={range}
                    onChange={e => setRange(e.target.value)}
                  >
                    {RANGES.map(item => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="health-metric-tabs">
                  {METRICS.map(metric => (
                    <button
                      key={metric.key}
                      type="button"
                      className={
                        metricKey === metric.key
                          ? "health-tab health-tab--active"
                          : "health-tab"
                      }
                      onClick={() => setMetricKey(metric.key)}
                    >
                      {metric.label}
                    </button>
                  ))}
                </div>

                <HealthLineChart
                  rows={chartRows}
                  metric={activeMetric}
                />

                <div className="health-stats-grid">
                  {[
                    {
                      label: "Average",
                      value: stats?.average
                    },
                    {
                      label: "Minimum",
                      value: stats?.min
                    },
                    {
                      label: "Maximum",
                      value: stats?.max
                    },
                    {
                      label: "Readings",
                      value: stats?.count,
                      unit: ""
                    }
                  ].map(item => (
                    <div className="health-stat" key={item.label}>
                      <span>{item.label}</span>
                      <strong>
                        {formatValue(item.value)}
                        {item.value != null && (
                          <small>
                            {item.unit ?? activeMetric.unit}
                          </small>
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="health-section health-panel">
                <div className="health-section-heading">
                  <div>
                    <span className="health-eyebrow">
                      DATABASE HISTORY
                    </span>
                    <h2>Measurement History</h2>
                    <p className="health-muted">
                      One row per stored measurement.
                    </p>
                  </div>
                  <span className="health-count">
                    {sortedRows.length} records
                  </span>
                </div>

                <div className="health-table-scroll">
                  <table className="health-history-table">
                    <thead>
                      <tr>
                        <th>Recorded at</th>
                        <th>Heart Rate</th>
                        <th>Oxygen</th>
                        <th>Temperature</th>
                        <th>Sleep</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRows.map(row => (
                        <tr key={row.id}>
                          <td>{formatDate(row.recordedAt)}</td>
                          <td>{formatValue(row.heartRate)} bpm</td>
                          <td>{formatValue(row.oxygenSaturation)} %</td>
                          <td>{formatValue(row.bodyTemperature)} °C</td>
                          <td>{formatValue(row.sleepHours)} h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {sortedRows.length > 10 && (
                  <button
                    type="button"
                    className="health-show-more"
                    onClick={() => setShowAll(value => !value)}
                  >
                    {showAll
                      ? "Show fewer records"
                      : `Show all ${sortedRows.length} records`}
                  </button>
                )}
              </section>

              <div className="health-data-footnote">
                <strong>Data provenance:</strong> Values are
                retrieved from the authenticated user's
                MySQL health records. No missing values
                are generated or interpolated. Database
                timestamps are displayed as stored.
                Recorded values alone do not establish
                a medical diagnosis.
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
