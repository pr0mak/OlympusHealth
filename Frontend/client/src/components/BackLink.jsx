import { Link } from "react-router-dom";

export default function BackLink({ onClick }) {
  return (
    <Link to="/" className="back-link" onClick={onClick} aria-label="Back to main page">
      <svg
        className="back-link-arrow"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m10 5-7 7 7 7M3 12h18" />
      </svg>
    </Link>
  );
}
