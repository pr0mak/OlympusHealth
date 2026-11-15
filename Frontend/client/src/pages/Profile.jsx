import BackLink from "../components/BackLink.jsx";

import { Navigate } from "react-router-dom";

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
      className="dashboard auth-entry-page profile-page"
      id="main-content"
      tabIndex={-1}
    >
      <BackLink />

      <section className="content-card auth-card" aria-labelledby="profile-title">
        <div className="profile-heading">
          <img
            src={`${import.meta.env.BASE_URL}astropic.png`}
            alt="Astronaut logo"
            className="profile-logo"
          />
          <h1 id="profile-title">Welcome, {user.username}!</h1>
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
