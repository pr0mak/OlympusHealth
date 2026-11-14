import { useState } from "react";
import PageHeading from "../components/PageHeading.jsx";
import TrendChart from "../components/TrendChart.jsx";
import {
  healthMetrics,
  heartRate,
  weeklyHeartRate,
  measurements,
} from "../data/mockHealth.js";

export default function HealthData() {
  const [period, setPeriod] = useState("day");
  return (
    <main className="dashboard detail-page" id="main-content" tabIndex={-1}>
      <PageHeading
        title="Health Data"
        description="Explore your measurements and trends in one place."
      />
      <p className="demo-note">
        Demo profile · All measurements on this page are mock data.
      </p>
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
      <section className="content-card" aria-labelledby="heart-rate-title">
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
      <section className="content-card" aria-labelledby="measurements-title">
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
