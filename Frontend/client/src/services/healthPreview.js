export function getHeartRatePreview(rows) {
  const readings = rows
    .filter(row => Number.isFinite(row.heartRate) && row.heartRate > 0)
    .sort((a, b) =>
      String(a.recordedAt ?? "").localeCompare(String(b.recordedAt ?? ""))
      || Number(a.id) - Number(b.id)
    );

  return {
    // Each record already contains an average heart rate. Match Health Overview's
    // latest available reading rather than averaging separate records again.
    heartRate: readings.at(-1)?.heartRate ?? null,
    history: readings.map(row => row.heartRate)
  };
}
