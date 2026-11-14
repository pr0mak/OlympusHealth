import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="dashboard detail-page" id="main-content" tabIndex={-1}>
      <h1>Page not found</h1>
      <p className="page-description">This page does not exist.</p>
      <Link to="/" className="back-link">
        ← Back to overview
      </Link>
    </main>
  );
}
