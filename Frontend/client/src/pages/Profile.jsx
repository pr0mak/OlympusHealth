import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { user, loading } = useAuth();
  if (loading) return <main className="dashboard" id="main-content" tabIndex={-1}><p>Loading profile...</p></main>;
  if (!user) return <Navigate to="/sign-in" replace />;
  return (
    <main className="dashboard auth-page" id="main-content" tabIndex={-1}>
      <Link to="/" className="back-link">← Back to overview</Link>
      <section className="content-card auth-card">
        <p className="eyebrow">Authenticated account</p>
        <h1>Welcome, {user.firstname}!</h1>
        <p className="muted-copy">Your information loaded from GET /api/auth/me.</p>
        <dl className="account-profile">
          <dt>Name</dt><dd>{user.firstname} {user.lastname}</dd>
          <dt>Email</dt><dd>{user.email}</dd>
          <dt>Phone</dt><dd>{user.phone}</dd>
          <dt>Role</dt><dd>{user.role}</dd>
        </dl>
      </section>
    </main>
  );
}
