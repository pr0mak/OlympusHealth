import { Link } from "react-router-dom";

export default function Widget({ id, title, to, children }) {
  return (
    <Link
      to={to}
      className={`widget widget--${id}`}
      aria-labelledby={`${id}-title`}
    >
      <header className="widget-header">
        <h2 id={`${id}-title`}>{title}</h2>
        <span className="widget-link-arrow" aria-hidden="true">
          ↗
        </span>
      </header>
      <div className="widget-preview">{children}</div>
      <span className="widget-open">
        Open {title.toLowerCase()} <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
