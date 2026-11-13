// =============================================================
//  All interface text in one place. Change the wording here.
//  (Category, service and area names are in placeTypes.js,
//   filter headings are in filters.js, the documentation text
//   is in src/content/Documentation.jsx.)
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
  days: ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"],
};
