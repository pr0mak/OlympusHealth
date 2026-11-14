import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeading from "../components/PageHeading.jsx";

const checkIns = [
  "Review today’s health measurements",
  "Record your sleep and activity",
  "Explore your next scenario",
];

export default function MissionAssistant() {
  const [completed, setCompleted] = useState([]);
  return (
    <main className="dashboard detail-page" id="main-content" tabIndex={-1}>
      <PageHeading
        title="Mission Assistant"
        description="Your workspace for daily check-ins and mission support."
      />
      <p className="demo-note">
        Demo workspace · Assistant responses and mission services are not
        connected yet.
      </p>
      <div className="detail-columns">
        <section className="content-card" aria-labelledby="check-in-title">
          <h2 id="check-in-title">Daily check-in</h2>
          <p className="muted-copy">
            A sample checklist to organize your overview.
          </p>
          <div className="checklist">
            {checkIns.map((item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={completed.includes(item)}
                  onChange={(event) =>
                    setCompleted((previous) =>
                      event.target.checked
                        ? [...previous, item]
                        : previous.filter((entry) => entry !== item),
                    )
                  }
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <p className="completion-note" role="status">
            {completed.length} of {checkIns.length} complete · This visit only
          </p>
        </section>
        <section className="content-card" aria-labelledby="workspace-title">
          <h2 id="workspace-title">Explore your mission</h2>
          <p className="muted-copy">
            Use your health overview and scenario lab as a starting point.
          </p>
          <Link className="workspace-link" to="/health-data">
            <span>Review health data</span>
            <span aria-hidden="true">↗</span>
          </Link>
          <Link className="workspace-link" to="/future-projection">
            <span>Explore future projections</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
