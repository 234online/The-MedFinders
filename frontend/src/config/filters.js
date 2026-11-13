import {
  CATEGORIES,
  FEATURES,
  AREAS,
  SPECIALTY_GROUPS,
} from "./placeTypes.js";

// =============================================================
//  FILTER DEFINITIONS
//  Every filter in the side panel comes from this list, in order.
//  To add a filter, add an object here. No other file needs changing.
//
//  Fields:
//    id        unique name; the filter's current value is stored under it
//    type      which control to draw: "chips" | "toggle" | "select" | "tree"
//    label     text shown for the filter
//    group     optional: filters with the same group share one section
//    collapsed optional: true = the section starts closed
//    default   value when nothing is selected (also used by "Reset")
//    options   for "chips" and "select": [{ value, label, color?, icon? }]
//    multiple  for "chips": true = several can be selected at once
//    groups    for "tree": [{ id, label, icon, items: [...] }]
//    test      (place, value) => true if the place should be shown
//
//  Places also have "score" (average review, or null) and
//  "reviewCount", added automatically, so filters can use them.
// =============================================================

export const FILTERS = [
  {
    id: "specialties",
    type: "tree",
    label: "Specialități",
    default: [],
    groups: SPECIALTY_GROUPS,
    // Shows places that offer AT LEAST ONE of the selected specialties
    test: (place, selected) =>
      selected.length === 0 || selected.some((s) => (place.specialties ?? []).includes(s)),
  },

  {
    id: "category",
    type: "chips",
    label: "Tip unitate",
    multiple: true,
    default: [],
    options: CATEGORIES.map((c) => ({ value: c.id, label: c.label, icon: c.icon, color: c.color })),
    test: (place, selected) => selected.length === 0 || selected.includes(place.category),
  },

  {
    id: "minScore",
    type: "chips",
    label: "Scor minim",
    multiple: false,
    default: "any",
    options: [
      { value: "any", label: "Orice" },
      { value: "3", label: "3+ ★" },
      { value: "4", label: "4+ ★" },
      { value: "4.5", label: "4.5+ ★" },
    ],
    test: (place, min) => min === "any" || (place.score ?? 0) >= Number(min),
  },

  {
    id: "area",
    type: "select",
    label: "Zonă",
    default: "any",
    options: [
      { value: "any", label: "Toată Timișoara" },
      ...AREAS.map((a) => ({ value: a, label: a })),
    ],
    test: (place, area) => area === "any" || place.area === area,
  },

  // One switch per service in FEATURES, all under "Servicii"
  ...FEATURES.map((feature) => ({
    id: feature.id,
    type: "toggle",
    group: "Servicii",
    label: feature.label,
    default: false,
    test: (place, on) => !on || place[feature.id] === true,
  })),
];
