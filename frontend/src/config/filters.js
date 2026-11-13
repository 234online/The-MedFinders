import {
  CATEGORIES,
  FEATURES,
  AREAS,
  SPECIALTIES,
  LANGUAGES,
  PRICE_LEVELS,
  PLACEHOLDER_2_OPTIONS,
  PLACEHOLDER_3_OPTIONS,
} from "./placeTypes.js";

// =============================================================
//  FILTER DEFINITIONS
//  Every filter in the side panel comes from this list, in order.
//  To add a filter, add an object here. No other file needs changing.
//
//  Fields:
//    id        unique name; the filter's current value is stored under it
//    type      which control to draw: "chips" | "toggle" | "select"
//    label     text shown for the filter
//    group     optional: filters with the same group share one section
//    collapsed optional: true = the section starts closed
//    default   value when nothing is selected (also used by "Reset")
//    options   for "chips" and "select": [{ value, label, color?, icon? }]
//    multiple  for "chips": true = several can be selected at once
//    test      (place, value) => true if the place should be shown
//
//  Places also have "score" (average review, or null) and
//  "reviewCount", added automatically, so filters can use them.
// =============================================================

export const FILTERS = [
  {
    id: "category",
    type: "chips",
    label: "Tip",
    multiple: true,
    default: [],
    options: CATEGORIES.map((c) => ({ value: c.id, label: c.label, icon: c.icon, color: c.color })),
    test: (place, selected) => selected.length === 0 || selected.includes(place.category),
  },

  {
    id: "specialty",
    type: "select",
    label: "Specialitate",
    default: "any",
    options: [
      { value: "any", label: "Orice specialitate" },
      ...SPECIALTIES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })),
    ],
    test: (place, s) => s === "any" || (place.specialties ?? []).includes(s),
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

  {
    id: "price",
    type: "chips",
    label: "Preț",
    collapsed: true,
    multiple: true,
    default: [],
    options: PRICE_LEVELS.map((p) => ({ value: p.id, label: p.label })),
    test: (place, selected) => selected.length === 0 || selected.includes(place.priceLevel),
  },

  {
    id: "languages",
    type: "chips",
    label: "Limbi vorbite",
    collapsed: true,
    multiple: true,
    default: [],
    options: LANGUAGES.map((l) => ({ value: l.id, label: l.label })),
    // Must speak ALL selected languages
    test: (place, selected) => selected.every((l) => (place.languages ?? []).includes(l)),
  },

  // ---------- PLACEHOLDERS: rename / replace these later ----------
  {
    id: "placeholder_1",
    type: "toggle",
    group: "Placeholder",
    collapsed: true,
    label: "placeholder_1",
    default: false,
    test: (place, on) => !on || place.placeholder_1 === true,
  },
  {
    id: "placeholder_2",
    type: "select",
    group: "Placeholder",
    label: "placeholder_2",
    default: "any",
    options: [
      { value: "any", label: "Oricare" },
      ...PLACEHOLDER_2_OPTIONS.map((o) => ({ value: o, label: o })),
    ],
    test: (place, v) => v === "any" || place.placeholder_2 === v,
  },
  {
    id: "placeholder_3",
    type: "chips",
    group: "Placeholder",
    label: "placeholder_3",
    multiple: true,
    default: [],
    options: PLACEHOLDER_3_OPTIONS.map((o) => ({ value: o, label: o })),
    test: (place, selected) => selected.length === 0 || selected.includes(place.placeholder_3),
  },
];
