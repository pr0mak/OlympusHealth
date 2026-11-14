
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main
        className="dashboard"
        id="main-content"
        tabIndex={-1}
      >
        <p>Loading profile...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <main
      className="dashboard auth-page"
      id="main-content"
      tabIndex={-1}
    >
      <Link to="/" className="back-link">
        ← Back to overview
      </Link>

      <section className="content-card auth-card">
        <p className="eyebrow">
          Authenticated astronaut
        </p>

        <h1>
          Welcome, {user.username}!
        </h1>

        <p className="muted-copy">
          Your account information is loaded
          securely from GET /api/auth/me.
        </p>

        <dl className="account-profile">
          <dt>User ID</dt>
          <dd>{user.id}</dd>

          <dt>Username</dt>
          <dd>{user.username}</dd>

          <dt>Gender</dt>
          <dd>
            {user.gender === "male"
              ? "Male"
              : user.gender === "female"
                ? "Female"
                : "Not specified"}
          </dd>

          <dt>Age</dt>
          <dd>{user.age} years</dd>
        </dl>

        <Link
          to="/future-projection"
          className="primary-button"
        >
          Explore Future Projection
        </Link>
      </section>
    </main>
  );
}
