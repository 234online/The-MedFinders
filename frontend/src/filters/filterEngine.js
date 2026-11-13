import { FEATURES, getCategory } from "../config/placeTypes.js";

// Starting value for every filter: { category: [], area: "any", open24h: false, ... }
export function getDefaults(filters) {
  return Object.fromEntries(filters.map((f) => [f.id, f.default]));
}

// How many filters are changed from their default (for the "Reset (n)" button)
export function countActive(filters, values) {
  return filters.filter(
    (f) => JSON.stringify(values[f.id]) !== JSON.stringify(f.default)
  ).length;
}

// A place is shown if it matches the search text AND passes every filter
export function applyFilters(places, filters, values, query) {
  return places.filter(
    (place) =>
      matchesQuery(place, query) &&
      filters.every((f) => f.test(place, values[f.id]))
  );
}

// Lowercase and strip diacritics, so "farmacie timisoara" matches "Farmacie Timișoara"
export function normalize(text) {
  return String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Text search over the name, type, area, address, description, tags, specialties and services.
// Every word typed must appear somewhere.
export function matchesQuery(place, query) {
  if (!query.trim()) return true;
  const haystack = normalize(
    [
      place.name,
      getCategory(place.category).label,
      place.area,
      place.address,
      place.description,
      ...(place.tags ?? []),
      ...(place.specialties ?? []),
      // services the place has, so "non-stop" or "CNAS" can be searched
      ...FEATURES.filter((f) => place[f.id] === true).map((f) => f.label),
    ]
      .filter(Boolean)
      .join(" ")
  );
  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}
