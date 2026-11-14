import { useCallback, useState } from "react";

// =============================================================
//  THE VISITOR'S CURRENT LOCATION (browser geolocation)
//  Asked only when they press "Lângă mine". The position stays in
//  the browser: it is never sent to our server.
//
//  status: "idle" | "locating" | "ok" | "denied" | "unavailable" | "unsupported"
//  position: { lat, lng, accuracy (m) } once status is "ok"
// =============================================================
export function useMyLocation() {
  const [state, setState] = useState({ status: "idle", position: null });

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ status: "unsupported", position: null });
      return;
    }
    setState((s) => ({ ...s, status: "locating" }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: "ok",
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy },
        }),
      (err) =>
        setState((s) => ({
          // Keep an older position if a refresh fails
          position: s.position,
          status: s.position ? "ok" : err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
        })),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  return { ...state, request };
}
