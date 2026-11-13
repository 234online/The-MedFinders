import {
  CATEGORIES,
  FEATURES,
  SPECIALTY_GROUPS,
  USED_KINDS,
  specialtyName,
} from "./placeTypes.js";
import { TEXT } from "./texts.js";
import { isOpenAt } from "../services/hoursLogic.js";
import { places } from "../data/loadPlaces.js";

// How many clinics offer each specialty (shown next to it in the filter)
const clinicsPerSpecialty = {};
for (const p of places) {
  for (const s of p.specialties) clinicsPerSpecialty[s] = (clinicsPerSpecialty[s] ?? 0) + 1;
}

// How many clinics offer at least one specialty of each group
const clinicsPerGroup = Object.fromEntries(
  SPECIALTY_GROUPS.map((g) => [
    g.id,
    places.filter((p) => p.specialties.some((s) => g.items.includes(s))).length,
  ])
);

// =============================================================
//  FILTER DEFINITIONS
//  Every filter in the side panel comes from this list, in order.
//  To add a filter, add an object here. No other file needs changing.
//
//  Fields:
//    id        unique name; the filter's current value is stored under it
//    type      which control to draw: "chips" | "toggle" | "select" | "tree"
//    label     text shown for the filter (a getter, so it follows the language)
//    group     optional: filters with the same group share one section
//    groupLabel  heading shown for that group
//    collapsed optional: true = the section starts closed
//    default   value when nothing is selected (also used by "Reset")
//    options   for "chips" and "select": [{ value, label, color?, icon? }]
//    multiple  for "chips": true = several can be selected at once
//    groups    for "tree": [{ id, label, icon, items: [...] }]
//    itemCounts / groupCounts  for "tree": number shown next to each item / group
//    itemLabel for "tree": (item) => text shown for an item
//    test      (place, value) => true if the place should be shown
//
//  The place fields come from src/data/loadPlaces.js. Places also get
//  "score" and "reviewCount", added automatically.
// =============================================================

export const FILTERS = [
  {
    id: "specialties",
    type: "tree",
    get label() {
      return TEXT.filterSpecialties;
    },
    default: [],
    groups: SPECIALTY_GROUPS,
    itemLabel: specialtyName,
    itemCounts: clinicsPerSpecialty,
    groupCounts: clinicsPerGroup,
    // Shows places that offer AT LEAST ONE of the selected specialties
    test: (place, selected) =>
      selected.length === 0 || selected.some((s) => place.specialties.includes(s)),
  },

  {
    id: "category",
    type: "chips",
    get label() {
      return TEXT.filterType;
    },
    multiple: true,
    default: [],
    options: CATEGORIES.filter((c) => USED_KINDS.has(c.id)).map((c) => ({
      value: c.id,
      get label() {
        return c.label;
      },
      icon: c.icon,
      color: c.color,
    })),
    test: (place, selected) => selected.length === 0 || selected.includes(place.category),
  },

  // ---------- Program ----------
  {
    id: "openNow",
    type: "toggle",
    group: "schedule",
    get groupLabel() {
      return TEXT.groupSchedule;
    },
    get label() {
      return TEXT.openNow;
    },
    default: false,
    test: (place, on) => !on || isOpenAt(place.hours) === true,
  },
  ...FEATURES.filter((f) => f.id === "open24h" || f.id === "weekend").map((feature) => ({
    id: feature.id,
    type: "toggle",
    group: "schedule",
    get groupLabel() {
      return TEXT.groupSchedule;
    },
    get label() {
      return feature.label;
    },
    default: false,
    test: (place, on) => !on || place[feature.id] === true,
  })),

  // ---------- Servicii ----------
  ...FEATURES.filter((f) => f.id === "emergency" || f.id === "kids").map((feature) => ({
    id: feature.id,
    type: "toggle",
    group: "services",
    get groupLabel() {
      return TEXT.groupServices;
    },
    get label() {
      return feature.label;
    },
    default: false,
    test: (place, on) => !on || place[feature.id] === true,
  })),

  {
    id: "minScore",
    type: "chips",
    get label() {
      return TEXT.filterMinScore;
    },
    multiple: false,
    default: "any",
    options: [
      {
        value: "any",
        get label() {
          return TEXT.scoreAny;
        },
      },
      { value: "4", label: "4+ ★" },
      { value: "4.5", label: "4.5+ ★" },
    ],
    test: (place, min) => min === "any" || (place.score ?? 0) >= Number(min),
  },
];
