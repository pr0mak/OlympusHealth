
import { useState } from "react";
import {
  Link,
  NavLink,
  useNavigate
} from "react-router-dom";

import Icon from "./Icon.jsx";
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
        aria-label="Home"
      >
        <span className="brand-symbol">
          <Icon name="orbit" />
        </span>

        <span className="brand-name">
          My<span>Logo</span>
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
            <NavLink
              className="register-link"
              to="/profile"
            >
              {user.username}
            </NavLink>

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
