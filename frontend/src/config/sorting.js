// =============================================================
//  SORT OPTIONS for the results list (dropdown above the list).
//  compare(a, b): negative = a first. null = keep the data's order.
// =============================================================

import { TEXT } from "./texts.js";

const scoreOf = (p) => p.score ?? 0;

export const SORT_OPTIONS = [
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

export function sortPlaces(places, sortId) {
  const option = SORT_OPTIONS.find((o) => o.id === sortId);
  return option?.compare ? [...places].sort(option.compare) : places;
}
