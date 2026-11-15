import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../api/client.js";
import AlertIcon from "./AlertIcon.jsx";
import "./AlertsPreview.css";

const PRIORITIES = ["high", "medium", "low"];

export default function AlertsPreview() {
  const { user, token, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (authLoading || userId == null || !token) return;
    let active = true;
    setResult(null);

    async function load() {
      try {
        const response = await apiRequest("/api/alerts", { token });
        if (!response.success || !Array.isArray(response.alerts)) {
          throw new Error("Invalid alerts response");
        }
        const alert = PRIORITIES
          .map(priority => response.alerts.find(item => item.priority === priority))
          .find(Boolean) ?? response.alerts[0];
        if (active) setResult({ userId, token, alert });
      } catch {
        if (active) setResult({ userId, token, error: true });
      }
    }

    load();
    return () => { active = false; };
  }, [authLoading, userId, token]);

  const signedIn = userId != null && Boolean(token);
  const current = !authLoading && signedIn
    && result?.userId === userId && result?.token === token ? result : null;
  const message = authLoading || (signedIn && !current)
    ? "Loading alerts…"
    : !signedIn
      ? "Sign in to view your alerts."
      : current?.error
        ? "Unable to load alerts."
        : !current?.alert ? "No current alerts." : "";

  if (message) return <p className="preview-copy" role="status">{message}</p>;

  const { alert } = current;
  const priority = PRIORITIES.includes(alert.priority) ? alert.priority : "low";
  return (
    <div className={`alerts-preview alerts-preview--${priority}`}>
      <AlertIcon priority={priority} />
      <div>
        <span className="alerts-preview-priority">{priority} priority</span>
        <strong>{alert.title || "Health observation"}</strong>
        {alert.detail && <p>{alert.detail}</p>}
      </div>
    </div>
  );
}
