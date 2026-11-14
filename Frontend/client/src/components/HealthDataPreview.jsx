import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { healthApi } from "../services/healthApi.js";
import { getHeartRatePreview } from "../services/healthPreview.js";
import TrendChart from "./TrendChart.jsx";

export default function HealthDataPreview() {
  const { user, token, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (authLoading || !userId || !token) return;

    let active = true;
    setResult(null);

    async function load() {
      try {
        const response = await healthApi.getMeasurements(token);
        if (!response?.success || !Array.isArray(response.data)) {
          throw new Error("Invalid health API response");
        }

        const preview = getHeartRatePreview(response.data);
        if (active) setResult({ userId, token, preview });
      } catch {
        if (active) setResult({ userId, token, error: true });
      }
    }

    load();
    return () => { active = false; };
  }, [userId, token, authLoading]);

  // Never display a previous account's data while a new request is pending.
  const signedIn = Boolean(userId && token);
  const currentResult = !authLoading && signedIn
    && result?.userId === userId && result?.token === token
    ? result : null;
  const loading = authLoading || (signedIn && !currentResult);
  const preview = currentResult?.preview;
  const message = loading
    ? "Loading health data…"
    : !signedIn
      ? "Sign in to view your health data."
      : currentResult?.error
        ? "Unable to load health data."
        : preview?.heartRate == null
          ? "No heart rate recorded."
          : "";

  return (
    <>
      <div className="preview-metric">
        <strong>
          {loading ? "…" : preview?.heartRate?.toLocaleString("en-US", {
            maximumFractionDigits: 2
          }) ?? "—"} <small>bpm</small>
        </strong>
        <span>Avg. heart rate</span>
      </div>
      {message && <p className="preview-copy" role="status">{message}</p>}
      {preview?.history.length > 1 && (
        <TrendChart
          values={preview.history}
          label="Recorded average heart rate in beats per minute"
          compact
        />
      )}
    </>
  );
}
