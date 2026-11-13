// =============================================================
//  All interface text in one place. Change the wording here.
//  (Category, service and area names are in placeTypes.js,
//   filter headings are in filters.js.)
// =============================================================

export const TEXT = {
  appTitle: "Harta medicală Timișoara",

  // Filter panel
  filtersTitle: "Filtre",
  reset: (n) => `Resetează (${n})`,

  // Results list
  resultsCount: (shown, total) => `Afișate: ${shown} din ${total}`,
  noResults: "Nicio locație nu corespunde căutării.",

  // Search bar
  searchPlaceholder: "Caută farmacii, clinici, spitale…",
  searchButton: "Caută",
  clearSearch: "Șterge căutarea",
};
