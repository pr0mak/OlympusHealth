import AlertIcon from "../components/AlertIcon.jsx";
import BackLink from "../components/BackLink.jsx";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../api/client.js";

import "./Alerts.css";

const PRIORITIES = {
  high: {
    label: "High",
    order: 0
  },
  medium: {
    label: "Medium",
    order: 1
  },
  low: {
    label: "Low",
    order: 2
  }
};

function PriorityLabel({ priority }) {
  const config = PRIORITIES[priority] || PRIORITIES.low;

  return (
    <span className={`alert-priority alert-priority--${priority}`}>
      {config.label}
    </span>
  );
}

export default function Alerts() {
  const {
    user,
    token,
    loading: authLoading
  } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!token || !user) {
      setAlerts([]);
      return;
    }

    let active = true;

    async function loadAlerts() {
      setLoading(true);
      setError("");
      setAlerts([]);

      try {
        const result = await apiRequest("/api/alerts", {
          token
        });

        if (!result.success || !Array.isArray(result.alerts)) {
          throw new Error("Invalid alerts response.");
        }

        if (active) {
          setAlerts(result.alerts);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load alerts.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAlerts();

    return () => {
      active = false;
    };
  }, [token, user?.id, authLoading]);

  // Highest priority first
  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      const priorityA = PRIORITIES[a.priority]?.order ?? 3;
      const priorityB = PRIORITIES[b.priority]?.order ?? 3;

      return priorityA - priorityB;
    });
  }, [alerts]);

  const counts = useMemo(() => ({
    high: alerts.filter(a => a.priority === "high").length,
    medium: alerts.filter(a => a.priority === "medium").length,
    low: alerts.filter(a => a.priority === "low").length
  }), [alerts]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="dashboard detail-page astra-alerts-page"
    >
      <BackLink />

      <div className="alerts-heading">
        <div>
          <h1>Alerts</h1>
        </div>

        <div className="alerts-heading-icon" aria-hidden="true">
          <AlertIcon priority={sortedAlerts[0]?.priority || "low"} />
        </div>
      </div>

      {authLoading ? (
        <p className="alerts-message">
          Checking your session...
        </p>
      ) : !user ? (
        <div className="alerts-message">
          Please <Link to="/sign-in">sign in</Link> to view your alerts.
        </div>
      ) : (
        <>
          <div className="alerts-account">
            <span>
              Showing alerts for
              {" "}<strong>{user.username}</strong>
            </span>

            <span>
              {sortedAlerts.length} observations
            </span>
          </div>

          {loading ? (
            <div className="alerts-message">
              Loading health alerts...
            </div>
          ) : error ? (
            <div className="alerts-message alerts-message--error" role="alert">
              {error}
            </div>
          ) : (
            <>
              <div className="alerts-summary">
                {Object.entries(PRIORITIES).map(([key, value]) => (
                  <div
                    key={key}
                    className={`alerts-summary-item alerts-summary-item--${key}`}
                  >
                    <AlertIcon priority={key} />

                    <div>
                      <strong>{counts[key]}</strong>
                      <span>{value.label} priority</span>
                    </div>
                  </div>
                ))}
              </div>

              <section className="alerts-table-section">
                <div className="alerts-section-heading">
                  <h2>Health alerts</h2>
                  <span>
                    Sorted by priority
                  </span>
                </div>

                {sortedAlerts.length === 0 ? (
                  <div className="alerts-message">
                    No alerts matched the current monitoring rules.
                    This does not establish medical safety.
                  </div>
                ) : (
                  <div className="alerts-table-scroll">
                    <table className="alerts-table">
                      <thead>
                        <tr>
                          <th scope="col">Alert</th>
                          <th scope="col">Description</th>
                          <th scope="col">Priority</th>
                        </tr>
                      </thead>

                      <tbody>
                        {sortedAlerts.map((alert, index) => (
                          <tr key={alert.id || index}>
                            <td>
                              <div className="alert-name">
                                <AlertIcon priority={alert.priority} />

                                <span>
                                  {alert.title || "Health observation"}
                                </span>
                              </div>
                            </td>

                            <td>
                              <div className="alert-description">
                                <span>{alert.detail || "No description available."}</span>

                                {alert.recordedAt && (
                                  <small>
                                    Recorded: {String(alert.recordedAt).replace("T", " ")}
                                  </small>
                                )}
                              </div>
                            </td>

                            <td>
                              <PriorityLabel
                                priority={alert.priority}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <p className="alerts-disclaimer">
                Alerts are generated from available health records
                using preliminary monitoring rules. They are not
                medical diagnoses or validated clinical risk assessments.
              </p>
            </>
          )}
        </>
      )}
    </main>
  );
}
