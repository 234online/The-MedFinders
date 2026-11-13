// =============================================================
//  All interface text in one place. Change the wording here.
//  (Category, service and area names are in placeTypes.js,
//   filter headings are in filters.js, the documentation text
//   is in src/content/Documentation.jsx.)
// =============================================================

export const TEXT = {
  appTitle: "Find the care you need",
  brand: "TimiCareNow",
  backHome: "Înapoi la pagina principală",

  // Start page
  landingTitle: "Find the care you need",
  landingSubtitle: "Toate informațiile de care ai nevoie într-un singur loc.",
  landingSearchPlaceholder: "Ex: farmacie non-stop, cardiologie, stomatolog Fabric…",
  landingSearchButton: "Caută",
  landingCategoriesTitle: "Sau alege un domeniu medical",
  landingTypesTitle: "Sau caută după tipul unității",
  landingQuickTitle: "Filtre rapide",
  showAllMap: "Vezi toată harta →",
  placesCount: (n) => (n === 1 ? "1 locație" : n >= 20 ? `${n} de locații` : `${n} locații`),

  // Filter panel
  filtersTitle: "Filtre",
  reset: (n) => `Resetează (${n})`,
  specialtySearch: "Caută o specialitate…",
  clinicsCount: (n) => (n === 1 ? "1 clinică" : n >= 20 ? `${n} de clinici` : `${n} clinici`),
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
  docsTitle: "Despre TimiCareNow",
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
  auth0Intro: "Autentificarea se face securizat prin Auth0. Poți folosi email și parolă sau contul Google.",
  googleLogin: "Continuă cu Google",
  auth0Note: "Autentificare securizată prin Auth0.",

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
  notStated: "Nespecificat",
  nextDay: "(a doua zi)",
  nonstop: "Non-stop",
  hoursLoading: "Se încarcă programul…",
  hoursUnavailable: "Program indisponibil",
  hoursFromGoogle: "Program preluat de pe Google Maps",
  contactTitle: "Contact",
  specialtiesTitle: "Specialități",
  servicesTitle: "Servicii",

  // Score & reviews
  noScore: "Nou",
  reviewsButton: "Recenzii și detalii",
  reviewsTitle: "Recenzii",
  reviewsCount: (n) =>
    n === 0 ? "Nicio evaluare" : n === 1 ? "1 evaluare" : n >= 20 ? `${n} de evaluări` : `${n} evaluări`,
  noReviews: "Nicio recenzie pe TimiCareNow încă. Fii primul care scrie una!",
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

  independent: "Independent",
  approximateLocation: "Poziția pe hartă este aproximativă (pe stradă).",
  doctorsTitle: "Medici",
  publicRatings: "Evaluări publice",
  siteReviews: "Recenzii pe TimiCareNow",
  votes: (n) => (n === 1 ? "1 vot" : n >= 20 ? `${n} de voturi` : `${n} voturi`),
  noRatingsYet: "Încă nu există evaluări pentru această locație.",
  sourcesTitle: (n) => `Surse (${n})`,
  dataNote: "Date verificate din surse publice (13.11.2026). Confirmă programul telefonic înainte de vizită. În caz de urgență, sună la 112.",
  daysShort: ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"],
  days: ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"],
};
