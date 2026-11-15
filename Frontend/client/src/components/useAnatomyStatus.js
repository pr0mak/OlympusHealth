
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../api/client.js";

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

        const result = await apiRequest(url, {
          token,
          signal: controller.signal,
        });

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
