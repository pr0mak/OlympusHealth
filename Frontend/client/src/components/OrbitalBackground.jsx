// Fixed positions keep the star field stable across renders and route changes.
const stars = Array.from({ length: 90 }, (_, index) => ({
  x: 18 + ((index * 619 + 137) % 1560),
  y: 12 + ((index * 347 + 83) % 1070),
  radius: index % 11 === 0 ? 1.9 : index % 3 === 0 ? 1.2 : 0.7,
  opacity: 0.25 + (index % 5) * 0.12,
}));

export default function OrbitalBackground() {
  return (
    <div className="orbital-background" aria-hidden="true">
      <svg viewBox="0 0 1600 1100" preserveAspectRatio="xMidYMid slice" fill="none">
        <g stroke="currentColor" strokeWidth="1.5" className="orbit-lines">
          <ellipse pathLength="1" cx="100" cy="1000" rx="1100" ry="650" transform="rotate(-18 100 1000)" />
          <ellipse pathLength="1" cx="100" cy="1000" rx="940" ry="530" transform="rotate(-18 100 1000)" />
          <ellipse pathLength="1" cx="100" cy="1000" rx="780" ry="410" transform="rotate(-18 100 1000)" />
          <ellipse pathLength="1" cx="1480" cy="130" rx="870" ry="600" transform="rotate(28 1480 130)" />
          <ellipse pathLength="1" cx="1480" cy="130" rx="700" ry="460" transform="rotate(28 1480 130)" />
          <ellipse pathLength="1" cx="1480" cy="130" rx="540" ry="320" transform="rotate(28 1480 130)" />
          <ellipse pathLength="1" cx="760" cy="650" rx="1160" ry="390" transform="rotate(-34 760 650)" />
          <ellipse pathLength="1" cx="760" cy="650" rx="1000" ry="290" transform="rotate(-34 760 650)" />
          <ellipse pathLength="1" cx="100" cy="1000" rx="1250" ry="770" transform="rotate(-18 100 1000)" />
          <ellipse pathLength="1" cx="100" cy="1000" rx="620" ry="310" transform="rotate(-18 100 1000)" />
          <ellipse pathLength="1" cx="1480" cy="130" rx="1040" ry="740" transform="rotate(28 1480 130)" />
          <ellipse pathLength="1" cx="1480" cy="130" rx="390" ry="210" transform="rotate(28 1480 130)" />
          <ellipse pathLength="1" cx="760" cy="650" rx="840" ry="195" transform="rotate(-34 760 650)" />
          <ellipse pathLength="1" cx="370" cy="180" rx="990" ry="540" transform="rotate(38 370 180)" />
          <ellipse pathLength="1" cx="370" cy="180" rx="800" ry="410" transform="rotate(38 370 180)" />
          <ellipse pathLength="1" cx="1160" cy="1090" rx="760" ry="420" transform="rotate(-12 1160 1090)" />
        </g>
        <g className="star-field" fill="currentColor">
          {stars.map((star, index) => (
            <circle key={index} cx={star.x} cy={star.y} r={star.radius} opacity={star.opacity} />
          ))}
        </g>
        <g className="star-glints" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round">
          <path d="M 220 160 h 8 m -4 -4 v 8" />
          <path d="M 655 375 h 10 m -5 -5 v 10" />
          <path d="M 1220 86 h 8 m -4 -4 v 8" />
          <path d="M 105 770 h 10 m -5 -5 v 10" />
          <path d="M 1380 895 h 8 m -4 -4 v 8" />
          <path d="M 900 980 h 6 m -3 -3 v 6" />
        </g>
      </svg>
    </div>
  );
}
