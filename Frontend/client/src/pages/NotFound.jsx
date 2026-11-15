import BackLink from "../components/BackLink.jsx";

export default function NotFound() {
  return (
    <main className="dashboard detail-page" id="main-content" tabIndex={-1}>
      <h1>Page not found</h1>
      <p className="page-description">This page does not exist.</p>
      <BackLink />
    </main>
  );
}
