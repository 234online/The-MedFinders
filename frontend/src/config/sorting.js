// =============================================================
//  SORT OPTIONS for the results list (dropdown above the list).
//  compare(a, b): negative = a first. null = keep the data's order.
//  needsLocation: only offered once we know where the visitor is.
// =============================================================

import { TEXT } from "./texts.js";
import { distanceKm } from "../utils/geo.js";

const scoreOf = (p) => p.score ?? 0;

export const SORT_OPTIONS = [
  {
    id: "distance",
    get label() {
      return TEXT.sortDistance;
    },
    needsLocation: true,
    compare: (a, b, origin) => distanceKm(origin, a) - distanceKm(origin, b),
  },
  {
    id: "relevance",
    get label() {
      return TEXT.sortRelevance;
    },
    compare: null,
  },
  {
    id: "score",
    get label() {
      return TEXT.sortScore;
    },
    compare: (a, b) => scoreOf(b) - scoreOf(a) || b.reviewCount - a.reviewCount,
  },
  {
    id: "reviews",
    get label() {
      return TEXT.sortReviews;
    },
    compare: (a, b) => b.reviewCount - a.reviewCount,
  },
  {
    id: "name",
    get label() {
      return TEXT.sortName;
    },
    compare: (a, b) => a.name.localeCompare(b.name, "ro"),
  },
];

// origin: the visitor's position { lat, lng }, needed for "distance"
export function sortPlaces(places, sortId, origin = null) {
  const option = SORT_OPTIONS.find((o) => o.id === sortId);
  if (!option?.compare || (option.needsLocation && !origin)) return places;
  return [...places].sort((a, b) => option.compare(a, b, origin));
}
