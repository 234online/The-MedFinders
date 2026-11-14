import { useEffect, useState } from "react";
import { API_ENABLED, apiFetch } from "../account/api.js";

// =============================================================
//  STATISTICS (backend -> Tiger Data). Real clicks only.
//  If the server has no Tiger connection it answers 503 and the
//  features stay hidden.
// =============================================================

// A clinic was opened (source: "popup" | "details"). Counted once per
// browser tab per clinic every 10 minutes; never blocks or breaks anything.
const lastViews = new Map();
export function trackView(placeId, source) {
  if (!API_ENABLED || !placeId) return;
  const key = `${placeId}|${source}`;
  if (Date.now() - (lastViews.get(key) ?? 0) < 10 * 60 * 1000) return;
  lastViews.set(key, Date.now());
  apiFetch("/api/views", { method: "POST", body: { placeId, source }, keepalive: true }).catch(() => {});
}

// "Popular times" for one clinic: { days[7][24], now: { level, ... }, source }
export function usePopularTimes(placeId) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!API_ENABLED || !placeId) return;
    let cancelled = false;
    apiFetch(`/api/analytics/popular-times/${encodeURIComponent(placeId)}`)
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && setData(null));
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  return data;
}

// Demand dashboard, refreshed every 30 seconds
export function useDashboard(days) {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    if (!API_ENABLED) {
      setState({ loading: false, data: null, error: "no-api" });
      return;
    }
    let cancelled = false;
    const load = () =>
      apiFetch(`/api/analytics/dashboard?days=${days}`)
        .then((data) => !cancelled && setState({ loading: false, data, error: null }))
        .catch((err) =>
          !cancelled &&
          setState((s) => ({ ...s, loading: false, error: /: 503$/.test(err.message) ? "off" : "failed" }))
        );
    setState((s) => ({ ...s, loading: true }));
    load();
    const timer = setInterval(load, 30 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [days]);

  return state;
}
