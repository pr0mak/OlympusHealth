
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BackLink from "../components/BackLink.jsx";
import ProjectionChapters from "../components/ProjectionChapters.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { futureProjectionApi } from "../api/client.js";
import "./FutureProjection.css";

const GROUPS = [
  {
    id: "generic_health",
    title: "Vital Signs",
    color: "var(--health)",
    icon: "♡",
    metrics: [
      ["avg_heart_rate", "Heart Rate", "bpm", "var(--health)"],
      ["oxygen_saturation", "Oxygen Saturation", "%", "var(--blue)"],
      ["body_temperature", "Body Temperature", "°C", "#fbbf24"],
      ["sleep_duration", "Sleep Duration", "h", "#a78bfa"]
    ]
  },
  {
    id: "muscle_health",
    title: "Muscle Health",
    color: "var(--violet)",
    icon: "◈",
    metrics: [
      ["muscle_atrophy", "Muscle Atrophy", "%"],
      ["muscle_fiber_type_i", "Type I Fibers", "%"],
      ["muscle_fiber_type_ii", "Type II Fibers", "%"],
      ["neuromuscular_coordination", "Neuromuscular Coordination", ""]
    ]
  },
  {
    id: "bone_health",
    title: "Bone Health",
    color: "var(--amber)",
    icon: "◇",
    metrics: [
      ["bone_density", "Bone Density", ""],
      ["bone_quality", "Bone Quality", ""],
      ["bone_metabolism_p1np", "P1NP", ""],
      ["bone_metabolism_ctx", "CTx", ""]
    ]
  },
  {
    id: "organ_health",
    title: "Organ Health",
    color: "var(--blue)",
    icon: "✦",
    metrics: [
      ["arrhythmia", "Arrhythmia", ""],
      ["kidney_stones_risk", "Kidney Stone Risk", "%"],
      ["oxygen_status", "Oxygen Status", "%"]
    ]
  },
  {
    id: "space_radiation",
    title: "Space Radiation",
    color: "var(--fire)",
    icon: "☼",
    metrics: [
      ["daily_radiation_dose", "Daily Radiation Dose", ""],
      ["cumulative_mission_dose", "Cumulative Mission Dose", ""],
      ["radiation_dose_rate", "Radiation Dose Rate", ""],
      ["radiation_event", "Radiation Event", ""]
    ]
  }
];

const DEFAULTS = {
  planning_days: 7,
  weekly_budget_minutes: 210,
  max_minutes_per_day: 60,
  target_minutes_per_day: 30,
  resistance_fraction: 0.5,
  resistance_intensity: "moderate",
  aerobic_intensity: "moderate",
  initial_fatigue: 20,
  fatigue_limit: 70
};

const fmt = (n, digits = 2) =>
  n !== null && n !== undefined && Number.isFinite(Number(n))
    ? Number(n).toLocaleString("en-US", {
        maximumFractionDigits: digits
      })
    : "—";

function LineGraph({
  values,
  labels,
  color = "var(--amber)",
  height = 174
}) {
  const numeric = values.map(Number);

  if (!numeric.length || numeric.some(v => !Number.isFinite(v))) {
    return <div className="fp-empty">No data available.</div>;
  }

  const w = 700;
  const h = height;
  const padX = 22;
  const top = 17;
  const bottom = 28;

  const minRaw = Math.min(...numeric);
  const maxRaw = Math.max(...numeric);
  const range = Math.max(maxRaw - minRaw, 0.00001);
  const padding = range * 0.15;

  const min = minRaw - padding;
  const max = maxRaw + padding;

  const x = i =>
    padX + (
      numeric.length === 1
        ? (w - 2 * padX) / 2
        : i * (w - 2 * padX) / (numeric.length - 1)
    );

  const y = v =>
    top + (max - v) * (h - top - bottom) / (max - min);

  const path = numeric
    .map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`)
    .join(" ");

  return (
    <div className="fp-graph-wrap">
      <svg
        className="fp-linegraph"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Estimated recovery load"
      >
        {[0, 0.5, 1].map(t => (
          <line
            key={t}
            x1={padX}
            x2={w - padX}
            y1={top + t * (h - top - bottom)}
            y2={top + t * (h - top - bottom)}
            stroke="var(--border)"
            strokeDasharray="4 6"
          />
        ))}

        {numeric.length > 1 && (
          <path
            d={path}
            stroke={color}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}

        {numeric.length <= 35 && numeric.map((v, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r="3.5"
            fill={color}
          >
            <title>
              {`${labels?.[i] || `Day ${i + 1}`}: ${fmt(v)}`}
            </title>
          </circle>
        ))}

        <text
          x={padX}
          y={h - 6}
          fill="var(--text-muted)"
          fontSize="11"
        >
          {labels?.[0] || "Start"}
        </text>

        <text
          x={w - padX}
          y={h - 6}
          fill="var(--text-muted)"
          textAnchor="end"
          fontSize="11"
        >
          {labels?.at(-1) || "End"}
        </text>
      </svg>

      <div className="fp-chart-range">
        <span>Min {fmt(minRaw)}</span>
        <span>Max {fmt(maxRaw)}</span>
      </div>
    </div>
  );
}

function FatigueComparisonChart({ data }) {
  const points = Array.isArray(data) ? data.filter(point =>
    Number.isFinite(Number(point.withExercise)) &&
    Number.isFinite(Number(point.withoutExercise))
  ) : [];

  if (!points.length) {
    return <div className="fp-empty">Comparison data unavailable.</div>;
  }

  const w = 700;
  const h = 205;
  const left = 28;
  const right = w - 28;
  const top = 18;
  const bottom = h - 30;
  const values = points.flatMap(point => [
    Number(point.withExercise), Number(point.withoutExercise)
  ]);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const margin = Math.max((high - low) * 0.15, 1);
  const y = value => bottom - (Number(value) - (low - margin)) *
    (bottom - top) / (high - low + 2 * margin);
  const x = index => left + (points.length === 1 ? (right - left) / 2 :
    index * (right - left) / (points.length - 1));
  const makePath = key => points.map((point, index) =>
    `${index === 0 ? "M" : "L"}${x(index)},${y(point[key])}`
  ).join(" ");

  return (
    <div className="fp-graph-wrap">
      <svg className="fp-linegraph" viewBox={`0 0 ${w} ${h}`}
        role="img" aria-label="Illustrative fatigue comparison with and without exercise">
        {[0, 0.5, 1].map(t => (
          <line key={t} x1={left} x2={right}
            y1={top + t * (bottom - top)} y2={top + t * (bottom - top)}
            stroke="var(--border)" strokeDasharray="4 6" />
        ))}
        <path d={makePath("withoutExercise")} fill="none"
          stroke="var(--fire)" strokeWidth="2.8" strokeDasharray="7 5"
          strokeLinecap="round" strokeLinejoin="round" />
        <path d={makePath("withExercise")} fill="none"
          stroke="var(--violet)" strokeWidth="2.8"
          strokeLinecap="round" strokeLinejoin="round" />
        {points.length <= 35 && points.map((point, index) => (
          <g key={point.day ?? index}>
            <circle cx={x(index)} cy={y(point.withoutExercise)} r="3"
              fill="var(--fire)">
              <title>{`Day ${point.day}: Without exercise ${fmt(point.withoutExercise)}`}</title>
            </circle>
            <circle cx={x(index)} cy={y(point.withExercise)} r="3"
              fill="var(--violet)">
              <title>{`Day ${point.day}: With exercise ${fmt(point.withExercise)}`}</title>
            </circle>
          </g>
        ))}
        <text x={left} y={h - 6} fontSize="11" fill="var(--text-muted)">
          {`Day ${points[0].day}`}
        </text>
        <text x={right} y={h - 6} textAnchor="end" fontSize="11"
          fill="var(--text-muted)">
          {`Day ${points.at(-1).day}`}
        </text>
      </svg>
      <div className="fp-legend">
        <span><i className="fp-dot fp-dot--fire" />Without exercise</span>
        <span><i className="fp-dot fp-dot--violet" />With exercise plan</span>
      </div>
      <div className="fp-chart-range">
        <span>Without: {fmt(points.at(-1).withoutExercise)}</span>
        <span>With: {fmt(points.at(-1).withExercise)}</span>
      </div>
      <p className="fp-footnote">
        Illustrative fatigue dynamics only. Not a measured or clinically validated health prediction.
      </p>
    </div>
  );
}

function ExerciseBars({ schedule }) {
  const max = Math.max(
    1,
    ...schedule.map(d => Number(d.total_minutes) || 0)
  );

  return (
    <div
      className="fp-exercise-bars"
      role="img"
      aria-label="Daily resistance and aerobic exercise durations"
    >
      {schedule.map(d => (
        <div className="fp-bar-row" key={d.day}>
          <span>Day {d.day}</span>

          <div className="fp-bar-track">
            <div
              className="fp-bar-resistance"
              style={{
                width: `${100 * d.resistance.minutes / max}%`
              }}
            />

            <div
              className="fp-bar-aerobic"
              style={{
                width: `${100 * d.aerobic.minutes / max}%`
              }}
            />
          </div>

          <strong>{fmt(d.total_minutes, 1)} min</strong>
        </div>
      ))}

      <div className="fp-legend">
        <span>
          <i className="fp-dot fp-dot--violet" />
          Resistance
        </span>

        <span>
          <i className="fp-dot fp-dot--cyan" />
          Aerobic
        </span>
      </div>
    </div>
  );
}

function ProjectionGraph({ current, points, unit }) {
  const series = [
    Number(current.value),
    ...points.map(p => Number(p.value))
  ];

  if (
    series.length < 2 ||
    series.some(v => !Number.isFinite(v))
  ) {
    return <div className="fp-empty">Projection unavailable.</div>;
  }

  const w = 700;
  const h = 150;
  const left = 26;
  const right = 674;
  const top = 16;
  const bottom = 120;

  const low = Math.min(...series);
  const high = Math.max(...series);

  const margin = Math.max(
    (high - low) * 0.2,
    Math.abs(low) * 0.005,
    0.001
  );

  const y = v =>
    bottom -
    ((v - (low - margin)) / (high - low + 2 * margin)) *
    (bottom - top);

  const x = i =>
    left + i * (right - left) / (series.length - 1);

  const path = series
    .map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`)
    .join(" ");

  return (
    <div className="fp-graph-wrap">
      <svg
        className="fp-linegraph"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`Projected values over ${points.length} days`}
      >
        {[0, 0.5, 1].map(t => (
          <line
            key={t}
            x1={left}
            x2={right}
            y1={top + t * (bottom - top)}
            y2={top + t * (bottom - top)}
            stroke="var(--border)"
            strokeDasharray="4 6"
          />
        ))}

        <path
          d={path}
          stroke="var(--fp-accent)"
          strokeWidth="2.8"
          fill="none"
          strokeDasharray="7 5"
          strokeLinecap="round"
        />

        <circle
          cx={x(0)}
          cy={y(series[0])}
          r="5"
          fill="var(--fp-accent)"
        />

        {points.map((p, i) => (
          <circle
            key={p.day}
            cx={x(i + 1)}
            cy={y(Number(p.value))}
            r="3"
            fill="var(--fp-accent)"
          >
            <title>
              {`${p.date}: ${fmt(p.value)} ${unit}`}
            </title>
          </circle>
        ))}

        <text
          x={left}
          y={h - 5}
          fontSize="11"
          fill="var(--text-muted)"
        >
          LATEST OBSERVATION
        </text>

        <text
          x={right}
          y={h - 5}
          textAnchor="end"
          fontSize="11"
          fill="var(--text-muted)"
        >
          +{points.length} DAYS
        </text>
      </svg>

      <div className="fp-chart-range">
        <span>
          Latest {fmt(current.value)} {unit}
        </span>
        <span>
          Projected {fmt(points.at(-1)?.value)} {unit}
        </span>
      </div>
    </div>
  );
}

function MetricCard({ group, metric, token, days }) {
  const [key, title, unit] = metric;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    let active = true;

    setLoading(true);
    setError("");
    setResult(null);

    futureProjectionApi
      .forecast(token, group.id, key, days)
      .then(response => {
        if (active) setResult(response.forecast);
      })
      .catch(err => {
        if (active) {
          setError(err.message || "Forecast unavailable");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, group.id, key, days]);

  const projected =
    result?.status === "projected" &&
    result?.points?.length > 0;

  return (
    <article className="fp-metric-card" style={{ "--fp-accent": metric[3] || group.color }}>
      <div className="fp-metric-top">
        <h3>{title}</h3>

        {!projected && (
          <span className="fp-pill">
            {loading ? "LOADING" : "NO FORECAST"}
          </span>
        )}
      </div>

      <div className="fp-metric-value">
        {projected
          ? fmt(result.lastObserved.value)
          : "—"}

        <small>
          {projected && unit ? ` ${unit}` : ""}
        </small>
      </div>

      <div className="fp-metric-meta">
        {projected
          ? `Latest observation · ${result.lastObserved.date} · ${result.observedDays} observed days`
          : loading
            ? "Calculating projection…"
            : error || result?.reason || "No forecast available"}
      </div>

      {projected && (
        <ProjectionGraph
          current={result.lastObserved}
          points={result.points}
          unit={unit}
        />
      )}

      {projected && (
        <p className="fp-footnote">
          Exploratory trend extrapolation.
          Not a validated medical prediction.
        </p>
      )}
    </article>
  );
}

export default function FutureProjection({ ready = true }) {
  const { token, loading: authLoading } = useAuth();

  const [groupId, setGroupId] = useState(GROUPS[0].id);
  const [forecastDays, setForecastDays] = useState(7);

  const [settings, setSettings] = useState(DEFAULTS);
  const [mpc, setMpc] = useState(null);
  const [fatigueComparison, setFatigueComparison] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasRun, setHasRun] = useState(false);

  const group = useMemo(
    () => GROUPS.find(g => g.id === groupId) || GROUPS[0],
    [groupId]
  );

  const update = (key, value) => {
    setSettings(previous => ({
      ...previous,
      [key]: value
    }));
  };

  async function generate(input = settings) {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const response = await futureProjectionApi.exerciseImpact(token, input);
      if (!response.exercisePlan?.schedule) {
        throw new Error("Exercise plan was missing from the response");
      }
      setMpc(response.exercisePlan);
      setFatigueComparison(response.fatigueComparison || []);
      setHasRun(true);
    } catch (err) {
      setError(err.message || "Unable to generate plan");
      setMpc(null);
      setFatigueComparison([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setMpc(null);
      setFatigueComparison([]);
      return;
    }

    let active = true;
    setLoading(true);

    futureProjectionApi
      .exerciseImpact(token, DEFAULTS)
      .then(response => {
        if (active) {
          if (!response.exercisePlan?.schedule) {
            throw new Error("Exercise plan was missing from the response");
          }
          setMpc(response.exercisePlan);
          setFatigueComparison(response.fatigueComparison || []);
          setHasRun(true);
        }
      })
      .catch(err => {
        if (active) {
          setError(err.message || "Unable to load plan");
          setFatigueComparison([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const schedule = mpc?.schedule || [];

  const total = schedule.reduce(
    (sum, day) => sum + Number(day.total_minutes || 0),
    0
  );

  return (
    <main
      className="dashboard detail-page fp-page"
      id="main-content"
      tabIndex={-1}
    >
      <header className="detail-heading">
        <BackLink />
        <h1>Future Projection</h1>
      </header>

      {!token ? (
        <section className="content-card fp-panel">
          <h2>Sign in to continue</h2>
          <p>
            Access your health projections and exercise planning.
          </p>
          <Link className="fp-primary" to="/sign-in">
            Sign in
          </Link>
        </section>
      ) : (
        <>
          <ProjectionChapters
            ready={ready}
            health={
              <>
                <div className="fp-summary fp-summary--health">
                  <div className="fp-summary-card" style={{ "--fp-accent": "var(--health)" }}>
                    <span className="fp-kicker">
                      HEALTH MONITORING
                    </span>
                    <strong>
                      19 <small>indicators</small>
                    </strong>
                    <p>Across five measurement categories</p>
                  </div>
                </div>
                <section
                  className="fp-section"
                  aria-labelledby="fp-health-heading"
                  style={{ "--fp-accent": group.color }}
                >
                  <div className="fp-section-heading">
                    <div>
                      <span className="fp-kicker">
                        01 / HEALTH INTELLIGENCE
                      </span>
                      <h2 id="fp-health-heading">
                        Health Trajectories
                      </h2>
                      <p>
                        Explore estimated trends starting from the
                        latest recorded measurement.
                      </p>
                    </div>

                  </div>

                  <div
                    className="fp-category-tabs"
                    role="group"
                    aria-label="Health category"
                  >
                    {GROUPS.map(item => (
                      <button
                        type="button"
                        key={item.id}
                        className={
                          groupId === item.id
                            ? "fp-tab fp-tab--active"
                            : "fp-tab"
                        }
                        onClick={() => setGroupId(item.id)}
                        style={{ "--fp-accent": item.color }}
                        aria-pressed={groupId === item.id}
                      >
                        <span aria-hidden="true">
                          {item.icon}
                        </span>
                        {" "}
                        {item.title}
                      </button>
                    ))}
                  </div>

                  <div className="fp-horizon">
                    <label htmlFor="fp-horizon">
                      Projection horizon
                    </label>

                    <select
                      id="fp-horizon"
                      value={forecastDays}
                      onChange={e =>
                        setForecastDays(Number(e.target.value))
                      }
                    >
                      <option value={7}>Next 7 days</option>
                      <option value={14}>Next 14 days</option>
                      <option value={30}>Next 30 days</option>
                    </select>
                  </div>

                  <div className="fp-metric-grid" key={groupId}>
                    {group.metrics.map(metric => (
                      <MetricCard
                        key={metric[0]}
                        group={group}
                        metric={metric}
                        token={token}
                        days={forecastDays}
                      />
                    ))}
                  </div>

                  <div className="fp-notice">
                    <strong>About future trajectories</strong>
                    <p>
                      Dashed colored lines represent exploratory
                      statistical projections calculated from
                      recent MySQL readings. They are not
                      clinically validated predictions.
                      Metrics with insufficient history or
                      without an appropriate model do not
                      display invented future values.
                    </p>
                  </div>
                </section>
              </>
            }
            activity={
              <>
                <div className="fp-summary fp-summary--activity">
                  <div className="fp-summary-card" style={{ "--fp-accent": "var(--violet)" }}>
                    <span className="fp-kicker">
                      ACTIVITY PLAN
                    </span>
                    <strong>
                      {mpc?.planning_days ?? settings.planning_days}
                      {" "}
                      <small>days</small>
                    </strong>
                    <p>Upcoming exercise schedule</p>
                  </div>
                  <div className="fp-summary-card" style={{ "--fp-accent": "var(--blue)" }}>
                    <span className="fp-kicker">
                      PLANNED ACTIVITY
                    </span>
                    <strong>
                      {mpc ? fmt(total, 1) : "—"}
                      {" "}
                      <small>min</small>
                    </strong>
                    <p>Model-generated activity duration</p>
                  </div>
                </div>
                <section
                  className="fp-section"
                  aria-labelledby="fp-exercise-heading"
                >
                  <div className="fp-section-heading">
                    <div>
                      <span className="fp-kicker">
                        02 / ACTIVITY INTELLIGENCE
                      </span>
                      <h2 id="fp-exercise-heading">
                        Exercise Planner
                      </h2>
                      <p>
                        Build an upcoming activity schedule
                        within your chosen limits.
                      </p>
                    </div>

                  </div>

                  <div className="fp-panel fp-settings-panel">
                    <h3>Plan settings</h3>

                    <div className="fp-settings-grid">
                      {[
                        ["planning_days", "Planning horizon (days)", 2, 30, 1],
                        ["weekly_budget_minutes", "Weekly time budget (min)", 0, 1260, 10],
                        ["max_minutes_per_day", "Daily maximum (min)", 1, 180, 5],
                        ["target_minutes_per_day", "Daily target (min)", 0, 180, 5],
                        ["initial_fatigue", "Starting fatigue (model index)", 0, 100, 1],
                        ["fatigue_limit", "Fatigue ceiling (model index)", 0, 100, 1]
                      ].map(([key, label, min, max, step]) => (
                        <label key={key}>
                          {label}
                          <input
                            type="number"
                            min={min}
                            max={max}
                            step={step}
                            value={settings[key]}
                            onChange={e =>
                              update(key, Number(e.target.value))
                            }
                          />
                        </label>
                      ))}

                      <label>
                        Resistance share (%)
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="5"
                          value={Math.round(
                            settings.resistance_fraction * 100
                          )}
                          onChange={e =>
                            update(
                              "resistance_fraction",
                              Number(e.target.value) / 100
                            )
                          }
                        />
                      </label>

                      {[
                        ["resistance_intensity", "Resistance intensity"],
                        ["aerobic_intensity", "Aerobic intensity"]
                      ].map(([key, label]) => (
                        <label key={key}>
                          {label}
                          <select
                            value={settings[key]}
                            onChange={e =>
                              update(key, e.target.value)
                            }
                          >
                            <option value="low">Low</option>
                            <option value="moderate">Moderate</option>
                            <option value="high">High</option>
                          </select>
                        </label>
                      ))}
                    </div>

                    <div className="fp-actions">
                      <button
                        type="button"
                        className="fp-primary"
                        disabled={loading || authLoading}
                        onClick={() => generate()}
                      >
                        {loading
                          ? "Preparing plan…"
                          : "Generate Exercise Plan"}
                      </button>

                      <button
                        type="button"
                        className="fp-secondary"
                        disabled={loading}
                        onClick={() => {
                          setSettings(DEFAULTS);
                          generate(DEFAULTS);
                        }}
                      >
                        Reset settings
                      </button>
                    </div>

                    {error && (
                      <p className="fp-error" role="alert">
                        {error}
                      </p>
                    )}
                  </div>

                  {mpc && (
                    <>
                      <div className="fp-two-columns">
                        <div className="fp-panel">
                          <div className="fp-panel-heading">
                            <h3>Daily Activity</h3>
                            <span className="fp-pill">
                              DURATION
                            </span>
                          </div>

                          <ExerciseBars schedule={schedule} />
                        </div>

                        <div className="fp-panel">
                          <div className="fp-panel-heading">
                            <h3>Estimated Recovery Load</h3>
                            <span className="fp-pill">
                              MODEL ESTIMATE
                            </span>
                          </div>

                          <LineGraph
                            values={schedule.map(
                              day => day.predicted_fatigue
                            )}
                            labels={schedule.map(
                              day => `Day ${day.day}`
                            )}
                            color="var(--amber)"
                          />

                          <p className="fp-footnote">
                            Estimated fatigue is a hypothetical
                            planning index, not a measured
                            health indicator.
                          </p>
                        </div>
                      </div>

                      <div className="fp-panel">
                        <div className="fp-panel-heading">
                          <h3>Exercise Impact · Fatigue Comparison</h3>
                          <span className="fp-pill">ILLUSTRATIVE MODEL</span>
                        </div>
                        <FatigueComparisonChart data={fatigueComparison} />
                      </div>

                      <div className="fp-panel">
                        <div className="fp-panel-heading">
                          <h3>Your Upcoming Schedule</h3>
                          <span className="fp-pill">
                            {mpc.planning_days} DAYS
                          </span>
                        </div>

                        <div className="fp-table-scroll">
                          <table className="fp-schedule-table">
                            <thead>
                              <tr>
                                <th>Day</th>
                                <th>Resistance</th>
                                <th>Aerobic</th>
                                <th>Total</th>
                                <th>Estimated fatigue</th>
                              </tr>
                            </thead>

                            <tbody>
                              {schedule.map(day => (
                                <tr key={day.day}>
                                  <td>
                                    <strong>Day {day.day}</strong>
                                  </td>

                                  <td>
                                    {fmt(day.resistance.minutes, 1)} min
                                    <small>
                                      {day.resistance.intensity}
                                    </small>
                                  </td>

                                  <td>
                                    {fmt(day.aerobic.minutes, 1)} min
                                    <small>
                                      {day.aerobic.intensity}
                                    </small>
                                  </td>

                                  <td>
                                    <strong>
                                      {fmt(day.total_minutes, 1)} min
                                    </strong>
                                  </td>

                                  <td>
                                    {fmt(day.predicted_fatigue, 1)} / 100
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {!mpc && !loading && !error && !hasRun && (
                    <div className="fp-empty">
                      Generate an exercise plan to see your schedule.
                    </div>
                  )}
                </section>

                <div className="fp-notice">
                  <strong>Model transparency</strong>
                  <p>
                    The exercise optimizer currently uses your
                    selected scheduling constraints and
                    illustrative fatigue dynamics.
                    Although recent health measurements are sent
                    to the engine, they do not yet influence
                    the optimization.
                    This is not a validated medical forecast
                    or an individual exercise prescription.
                  </p>
                </div>
              </>
            }
          />
        </>
      )}
    </main>
  );
}
