export default function TrendChart({
  values,
  label,
  compact = false,
  startLabel,
  endLabel,
}) {
  const width = 640;
  const height = compact ? 80 : 200;
  const padding = 12;
  const minimum = Math.min(...values) - 4;
  const maximum = Math.max(...values) + 4;
  const points = values
    .map((value, index) => {
      const x =
        padding +
        (index / Math.max(values.length - 1, 1)) * (width - 2 * padding);
      const y =
        height -
        padding -
        ((value - minimum) / (maximum - minimum)) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={`trend-chart${compact ? " trend-chart--compact" : ""}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}. Values: ${values.join(", ")}.`}
      >
        {!compact &&
          [0.25, 0.5, 0.75].map((fraction) => (
            <line
              key={fraction}
              x1="0"
              x2={width}
              y1={height * fraction}
              y2={height * fraction}
              className="chart-grid-line"
            />
          ))}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth={compact ? 2 : 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {!compact && (
        <div className="chart-axis">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      )}
    </div>
  );
}
