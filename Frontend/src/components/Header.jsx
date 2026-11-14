import { Link, NavLink } from "react-router-dom";
import Icon from "./Icon.jsx";

export default function Header() {
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Home">
        <span className="brand-symbol">
          <Icon name="orbit" />
        </span>
        <span className="brand-name">
          My<span>Logo</span>
        </span>
      </Link>
      <nav className="account-nav" aria-label="Account">
        <NavLink className="register-link" to="/register">
          Register
        </NavLink>
        <NavLink className="sign-in-link" to="/sign-in">
          Sign in <span aria-hidden="true">↗</span>
        </NavLink>
      </nav>
    </header>
  );
}
