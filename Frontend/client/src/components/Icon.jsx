const paths = {
  health: <path d="M3 12h4l3-7 4 14 3-7h4" />,
  assistant: (
    <>
      <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-5 3V11.5A7.5 7.5 0 0 1 10.5 4h2A7.5 7.5 0 0 1 20 11.5Z" />
      <path d="M8 11h.01M12 11h.01M16 11h.01" />
    </>
  ),
  projection: (
    <>
      <path d="M4 4v16h16M8 15l4-5 4 2 4-7" />
      <path d="M16 5h4v4" />
    </>
  ),
  orbit: (
    <>
      <circle cx="12" cy="12" r="4" />
      <ellipse cx="12" cy="12" rx="11" ry="5" transform="rotate(-35 12 12)" />
      <path d="M12 1v2m0 18v2" />
    </>
  ),
  cube: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9M8 5.2l8 4.6" />
    </>
  ),
};

export default function Icon({ name, className = "" }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
