import { useState } from "react";
import {
  Link,
  NavLink,
  useNavigate
} from "react-router-dom";

import MissionTimer from "./MissionTimer.jsx";

import { useAuth } from "../context/AuthContext.jsx";

export default function Header({ showMission = false }) {
  const [missionStartedAt] = useState(() => Date.now());

  const { user, loading, signOut } = useAuth();

  const navigate = useNavigate();

  function logout() {
    signOut();
    navigate("/sign-in");
  }

  return (
    <header
      className={
        `site-header${showMission ? " site-header--mission" : ""}`
      }
    >
      {/* Brand */}
      <Link
        className="brand"
        to="/"
        aria-label="Olympus Health home"
      >
        <span className="brand-symbol">
          <img
            src={`${import.meta.env.BASE_URL}brand/astra-logo.png`}
            alt=""
            width="48"
            height="48"
          />
        </span>

        <span className="brand-name">
          Olympus Health
        </span>
      </Link>

      {/* Mission Timer */}
      {showMission && (
        <MissionTimer startedAt={missionStartedAt} />
      )}

      {/* Authentication navigation */}
      <nav
        className="account-nav"
        aria-label="Account"
      >
        {loading ? (
          <span className="account-muted">
            Loading account...
          </span>

        ) : user ? (
          <>
            <p className="welcome-text">
              Welcome{" "}
              <span>
                <Link to="/profile" className="username-link">
                  {user.username}
                </Link>
              </span>
            </p>

            <button
              className="sign-in-link account-logout"
              type="button"
              onClick={logout}
            >
              Log out
            </button>
          </>

        ) : (
          <>
            <NavLink
              className="register-link"
              to="/register"
            >
              Register
            </NavLink>

            <NavLink
              className="sign-in-link"
              to="/sign-in"
            >
              Sign in{" "}
              <span aria-hidden="true">
                ↗
              </span>
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
