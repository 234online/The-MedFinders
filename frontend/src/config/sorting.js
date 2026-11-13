// =============================================================
//  SORT OPTIONS for the results list (dropdown above the list).
//  compare(a, b): negative = a first. null = keep the data's order.
// =============================================================

const scoreOf = (p) => p.score ?? 0;

export const SORT_OPTIONS = [
  { id: "relevance", label: "Relevanță", compare: null },
  {
    id: "score",
    label: "Scor (mare → mic)",
    compare: (a, b) => scoreOf(b) - scoreOf(a) || b.reviewCount - a.reviewCount,
  },
  {
    id: "reviews",
    label: "Cele mai multe recenzii",
    compare: (a, b) => b.reviewCount - a.reviewCount,
  },
  {
    id: "name",
    label: "Nume (A–Z)",
    compare: (a, b) => a.name.localeCompare(b.name, "ro"),
  },
];

export function sortPlaces(places, sortId) {
  const option = SORT_OPTIONS.find((o) => o.id === sortId);
  return option?.compare ? [...places].sort(option.compare) : places;
}
