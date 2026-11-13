import { CATEGORIES, FEATURES, AREAS } from "./placeTypes.js";

// =============================================================
//  FILTER DEFINITIONS
//  Every filter in the side panel comes from this list, in order.
//  To add a filter, add an object here. No other file needs changing.
//
//  Fields:
//    id       unique name; the filter's current value is stored under it
//    type     which control to draw: "chips" | "toggle" | "select"
//             (the controls live in src/filters/)
//    label    text shown for the filter
//    group    optional: filters with the same group are shown together
//             under one heading (otherwise the label is the heading)
//    default  value when nothing is selected (also used by "Reset")
//    options  for "chips" and "select": [{ value, label, color? }]
//    multiple for "chips": true = several can be selected at once
//    test     (place, value) => true if the place should be shown
// =============================================================

export const FILTERS = [
  {
    id: "category",
    type: "chips",
    label: "Tip",
    multiple: true,
    default: [],
    options: CATEGORIES.map((c) => ({ value: c.id, label: c.label, color: c.color })),
    // Nothing selected = show all types
    test: (place, selected) => selected.length === 0 || selected.includes(place.category),
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

  // One switch per service in FEATURES, all under a "Servicii" heading
  ...FEATURES.map((feature) => ({
    id: feature.id,
    type: "toggle",
    group: "Servicii",
    label: feature.label,
    default: false,
    // Switch off = don't care; switch on = place must have it
    test: (place, on) => !on || place[feature.id] === true,
  })),
];
