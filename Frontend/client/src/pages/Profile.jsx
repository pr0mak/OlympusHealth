
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

        <div className="profile-heading">
          <h1>Welcome, {user.username}!</h1>

          <img
            src={`${import.meta.env.BASE_URL}brand/astra-logo.png`}
            alt="ASTRA logo"
            className="profile-logo"
          />
        </div>


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

      </section>
    </main>
  );
}
