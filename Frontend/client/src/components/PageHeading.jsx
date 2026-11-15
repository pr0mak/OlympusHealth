import BackLink from "./BackLink.jsx";
import { NavLink } from "react-router-dom";

export default function PageHeading({ title, description }) {
  return (
    <header className="detail-heading">
      <BackLink />
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
      <nav className="section-nav" aria-label="Health sections">
        <NavLink to="/health-data">Health Data</NavLink>
        <NavLink to="/mission-assistant">Mission Assistant</NavLink>
        <NavLink to="/future-projection">Future Projection</NavLink>
      </nav>
    </header>
  );
}
