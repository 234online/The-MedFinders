// =============================================================
//  DISTANCES on the map (straight line, "as the crow flies")
// =============================================================

// Distance in km between two points { lat, lng } (haversine formula)
export function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 0.42 -> "420 m", 3.456 -> "3,5 km", 27 -> "27 km"
export function formatDistance(km) {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  const value = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return `${value.toLocaleString("ro-RO")} km`;
}

// Google Maps directions to a place. Only the destination is sent:
// Google uses the visitor's own location as the starting point.
export function directionsUrl(place) {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
}
