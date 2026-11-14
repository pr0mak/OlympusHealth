import Header from "./components/Header.jsx";
import ViewerPlaceholder from "./components/ViewerPlaceholder.jsx";
import Widget from "./components/Widget.jsx";

const widgets = [
  {
    id: "health-data",
    title: "Health Data",
  },
  {
    id: "mission-assistant",
    title: "Mission Assistant",
  },
  {
    id: "future-projection",
    title: "Future Projection",
  },
];

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="dashboard">
        <div className="dashboard-grid">
          <ViewerPlaceholder />
          <aside
            className="widget-stack"
            aria-label="Health and mission widgets"
          >
            {widgets.map((widget) => (
              <Widget key={widget.id} {...widget} />
            ))}
          </aside>
        </div>
      </main>
      <footer className="page-footer">
        <span>NASA Space Apps Challenge 2026</span>
        <span>Astronaut Health Monitoring</span>
      </footer>
    </div>
  );
}
