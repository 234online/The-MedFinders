import { useEffect, useState } from "react";
import { API_ENABLED, bookingApi } from "./api.js";

// =============================================================
//  Which clinics take online appointments: those with at least one
//  doctor on the site. Asked once per page load and shared by every
//  popup / details window.
//    useBookingClinics() -> null while loading, then { "clinic-id": doctorCount }
// =============================================================

let cache = null;
let request = null;
const listeners = new Set();

function load() {
  if (!request) {
    request = bookingApi
      .clinics()
      .catch(() => ({})) // backend unreachable: no clinic takes bookings
      .then((counts) => {
        cache = counts;
        listeners.forEach((fn) => fn(counts));
        return counts;
      });
  }
  return request;
}

// After a doctor is approved the list changes: ask again
export function refreshBookingClinics() {
  request = null;
  return load();
}

export function useBookingClinics() {
  const [counts, setCounts] = useState(cache);
  useEffect(() => {
    if (!API_ENABLED) return;
    listeners.add(setCounts);
    if (!cache) load();
    return () => listeners.delete(setCounts);
  }, []);
  return API_ENABLED ? counts : {};
}
