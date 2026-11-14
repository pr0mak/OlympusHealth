import { useState } from 'react';
import PageHeading from '../components/PageHeading.jsx';
import TrendChart from '../components/TrendChart.jsx';
import { createProjection } from '../data/mockHealth.js';

export default function FutureProjection() {
  const [days, setDays] = useState(7);
  const [sleep, setSleep] = useState(7.5);
  const [exercise, setExercise] = useState(30);
  const values = createProjection(days, sleep, exercise);
  return (
    <main className="dashboard detail-page" id="main-content" tabIndex={-1}>
      <PageHeading title="Future Projection" description="Explore how different scenarios could look over time." />
      <p className="demo-note">Illustrative demo · These synthetic values demonstrate the interface, not a medical forecast.</p>
      <div className="scenario-layout">
        <section className="content-card scenario-inputs" aria-labelledby="scenario-title">
          <h2 id="scenario-title">Your scenario</h2>
          <label htmlFor="sleep">Sleep per night <output htmlFor="sleep">{sleep} h</output></label>
          <input id="sleep" type="range" min="4" max="10" step="0.5" value={sleep} onChange={(event) => setSleep(Number(event.target.value))} />
          <label htmlFor="exercise">Daily exercise <output htmlFor="exercise">{exercise} min</output></label>
          <input id="exercise" type="range" min="0" max="90" step="5" value={exercise} onChange={(event) => setExercise(Number(event.target.value))} />
          <button className="secondary-button" type="button" onClick={() => { setDays(7); setSleep(7.5); setExercise(30); }}>Reset scenario</button>
        </section>
        <section className="content-card" aria-labelledby="projection-title">
          <header className="card-heading">
            <div><h2 id="projection-title">Activity index</h2><p>Illustrative index · arbitrary units</p></div>
            <div className="segmented-control" role="group" aria-label="Projection horizon">
              {[7, 14, 30].map((period) => <button key={period} type="button" aria-pressed={days === period} onClick={() => setDays(period)}>{period} days</button>)}
            </div>
          </header>
          <TrendChart values={values} label="Illustrative activity index in arbitrary units" startLabel="Today" endLabel={`Day ${days}`} />
        </section>
      </div>
    </main>
  );
}
