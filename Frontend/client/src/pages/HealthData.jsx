import { useEffect, useState } from "react";

import PageHeading from "../components/PageHeading.jsx";
import TrendChart from "../components/TrendChart.jsx";

import {
  healthMetrics,
  heartRate,
  weeklyHeartRate,
  measurements,
} from "../data/mockHealth.js";


import { healthApi } from "../services/healthApi.js";

export default function HealthData() {
  const [period, setPeriod] = useState("day");
  const [apiStatus, setApiStatus] = useState("checking");

  // Test connection with Backend
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No JWT token found in localStorage");
      setApiStatus("no-token");
      return;
    }

    healthApi
      .getSummary(token)
      .then((data) => {
        console.log("Health Summary from Backend:", data);
        setApiStatus("connected");
      })
      .catch((error) => {
        console.error("Health API Error:", error);
        setApiStatus("error");
      });
  }, []);

  return (
    <main
      className="dashboard detail-page health-data-page"
      id="main-content"
      tabIndex={-1}
    >
      <PageHeading
        title="Health Data"
        description="Explore your measurements and trends in one place."
      />

      <p className="demo-note">
        Demo profile · All measurements on this page are mock data.
      </p>

      {/* Backend connection status */}
      {apiStatus === "checking" && (
        <p className="demo-note">
          Checking backend connection...
        </p>
      )}

      {apiStatus === "connected" && (
        <p className="demo-note">
          Backend connected successfully. Check the browser console.
        </p>
      )}

      {apiStatus === "no-token" && (
        <p className="demo-note">
          No authentication token found. Please log in first.
        </p>
      )}

      {apiStatus === "error" && (
        <p className="demo-note" role="alert">
          Could not connect to the Health API. Check the browser console.
        </p>
      )}

      {/* Health metrics */}
      <div className="metrics-grid">
        {healthMetrics.map((metric) => (
          <section
            className="content-card metric-card"
            key={metric.label}
            aria-label={metric.label}
          >
            <p>{metric.label}</p>

            <strong>
              {metric.value} <small>{metric.unit}</small>
            </strong>
          </section>
        ))}
      </div>

      {/* Heart rate chart */}
      <section
        className="content-card"
        aria-labelledby="heart-rate-title"
      >
        <header className="card-heading">
          <div>
            <h2 id="heart-rate-title">Heart rate</h2>
            <p>Sample readings · beats per minute</p>
          </div>

          <div
            className="segmented-control"
            role="group"
            aria-label="Heart rate period"
          >
            <button
              type="button"
              aria-pressed={period === "day"}
              onClick={() => setPeriod("day")}
            >
              Today
            </button>

            <button
              type="button"
              aria-pressed={period === "week"}
              onClick={() => setPeriod("week")}
            >
              7 days
            </button>
          </div>
        </header>

        <TrendChart
          values={period === "day" ? heartRate : weeklyHeartRate}
          label="Sample heart rate in beats per minute"
          startLabel={period === "day" ? "07:00" : "Day 1"}
          endLabel={period === "day" ? "14:00" : "Day 7"}
        />
      </section>

      {/* Recent measurements */}
      <section
        className="content-card"
        aria-labelledby="measurements-title"
      >
        <h2 id="measurements-title">Recent measurements</h2>

        <div className="table-scroll">
          <table>
            <caption className="visually-hidden">
              Sample measurements for the demo profile
            </caption>

            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Measurement</th>
                <th scope="col">Value</th>
                <th scope="col">Source</th>
              </tr>
            </thead>

            <tbody>
              {measurements.map((item) => (
                <tr key={item.metric}>
                  <td>{item.time}</td>
                  <th scope="row">{item.metric}</th>
                  <td>{item.value}</td>
                  <td>{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}