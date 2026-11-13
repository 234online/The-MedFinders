// =============================================================
//  All interface text in one place. Change the wording here.
//  (Category, service and area names are in placeTypes.js,
//   filter headings are in filters.js, the documentation text
//   is in src/content/Documentation.jsx.)
// =============================================================

export const TEXT = {
  appTitle: "Harta medicală Timișoara",
  brand: "MedFinders",
  backHome: "Înapoi la pagina principală",

  // Start page
  landingTitle: "Găsește îngrijirea medicală potrivită în Timișoara",
  landingSubtitle: "Spitale, clinici, farmacii și medici: cu program, recenzii și scoruri, pe o singură hartă.",
  landingSearchPlaceholder: "Ex: farmacie non-stop, cardiologie, stomatolog Fabric…",
  landingSearchButton: "Caută",
  landingCategoriesTitle: "Sau alege un domeniu medical",
  landingPharmacies: "💊 Farmacii",
  pharmacySearch: "Farmacii",
  landingQuickTitle: "Filtre rapide",
  showAllMap: "Vezi toată harta →",
  placesCount: (n) => (n === 1 ? "1 locație" : n >= 20 ? `${n} de locații` : `${n} locații`),

  // Filter panel
  filtersTitle: "Filtre",
  reset: (n) => `Resetează (${n})`,
  specialtySearch: "Caută o specialitate…",
  specialtyNoMatch: "Nicio specialitate găsită.",
  selectAll: "Selectează tot domeniul",
  unselectAll: "Deselectează tot domeniul",

  // Results list
  resultsCount: (shown, total) => `Afișate: ${shown} din ${total}`,
  noResults: "Nicio locație nu corespunde căutării.",
  sortLabel: "Sortează",

  // Search bar
  searchPlaceholder: "Caută farmacii, clinici, spitale…",
  searchButton: "Caută",
  clearSearch: "Șterge căutarea",

  // Floating buttons
  infoButton: "Despre aplicație",
  accountButton: "Contul meu",

  // Windows (modals)
  close: "Închide",
  docsTitle: "Despre MedFinders",
  loginTitle: "Autentificare",
  accountTitle: "Contul meu",

  // Login
  email: "Email",
  password: "Parolă",
  loginButton: "Intră în cont",
  registerButton: "Creează cont",
  switchToRegister: "Nu ai cont? Creează unul",
  switchToLogin: "Ai deja cont? Autentifică-te",
  loginToSave: "Autentifică-te pentru a salva locații la favorite.",
  invalidEmail: "Introdu o adresă de email validă.",
  shortPassword: "Parola trebuie să aibă cel puțin 4 caractere.",
  prototypeNote: "Prototip: contul este salvat doar în acest browser.",

  // Saved places
  loggedInAs: "Conectat ca",
  savedTitle: "Locații salvate",
  savedEmpty: "Nu ai salvat nicio locație încă. Apasă „Salvează la favorite” în fereastra unei locații de pe hartă.",
  removeFavorite: "Elimină de la favorite",
  logout: "Deconectare",

  // Place popup
  save: "☆ Salvează la favorite",
  saved: "★ Salvat la favorite",
  hoursTitle: "Program",
  openNow: "Deschis acum",
  closedNow: "Închis acum",
  closed: "Închis",
  nonstop: "Non-stop",
  hoursLoading: "Se încarcă programul…",
  hoursUnavailable: "Program indisponibil",
  hoursFromGoogle: "Program preluat de pe Google Maps",
  contactTitle: "Contact",
  priceTitle: "Preț",
  languagesTitle: "Limbi vorbite",
  specialtiesTitle: "Specialități",
  servicesTitle: "Servicii",

  // Score & reviews
  noScore: "Nou",
  reviewsButton: "Recenzii și detalii",
  reviewsTitle: "Recenzii",
  reviewsCount: (n) =>
    n === 0 ? "Nicio recenzie" : n === 1 ? "1 recenzie" : n >= 20 ? `${n} de recenzii` : `${n} recenzii`,
  noReviews: "Nicio recenzie încă. Fii primul care scrie una!",
  writeReview: "Scrie o recenzie",
  loginToReviewButton: "Autentifică-te pentru a scrie o recenzie",
  loginToReview: "Autentifică-te pentru a scrie o recenzie.",
  yourRating: "Nota ta",
  yourReview: "Părerea ta",
  reviewPlaceholder: "Cum a fost experiența ta? (personal, timp de așteptare, curățenie…)",
  submitReview: "Publică recenzia",
  cancel: "Anulează",
  reviewNeedsRating: "Alege o notă de la 1 la 5 stele.",
  reviewTooShort: "Scrie cel puțin câteva cuvinte.",
  yourReviewTag: "Recenzia ta",
  demoReviewsNote: "Recenziile existente sunt exemple de test (prototip).",

  days: ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"],
};
