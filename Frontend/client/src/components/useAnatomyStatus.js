
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export function useAnatomyStatus(category, regionKey) {
  const { token } = useAuth();

  const [state, setState] = useState({
    data: null,
    loading: false,
    error: "",
  });

  useEffect(() => {
    if (!regionKey) {
      setState({ data: null, loading: false, error: "" });
      return;
    }

    if (!token) {
      setState({
        data: null,
        loading: false,
        error: "Please sign in to view measurements.",
      });
      return;
    }

    const controller = new AbortController();

    async function loadData() {
      setState({ data: null, loading: true, error: "" });

      try {
        const url =
          `/api/anatomy/${category}/${encodeURIComponent(regionKey)}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            `API returned HTML instead of JSON (${response.status}). ` +
            "Check Express routes and Vite proxy."
          );
        }

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || `API error (${response.status})`
          );
        }

        if (!controller.signal.aborted) {
          setState({
            data: result.data,
            loading: false,
            error: "",
          });
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        setState({
          data: null,
          loading: false,
          error: error.message,
        });
      }
    }

    loadData();

    return () => controller.abort();
  }, [category, regionKey, token]);

  return state;
}
