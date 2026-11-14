// =============================================================
//  ALL INTERFACE TEXT, in three languages: ro, en, hu.
//  Change the wording here. Every key must exist in "ro";
//  if a key is missing in "en" or "hu", the Romanian text is used.
//
//  The rest of the app uses TEXT.someKey, which always gives the
//  text in the language currently chosen (see setLanguage below).
//  (Category, specialty and service names are in placeTypes.js,
//   symptoms in symptoms.js, documentation in Documentation.jsx.)
// =============================================================

export const LANGUAGES = [
  { id: "ro", label: "RO", name: "Română" },
  { id: "en", label: "EN", name: "English" },
  { id: "hu", label: "HU", name: "Magyar" },
];

const TEXTS = {
  // ---------------------------------------------------------- ROMÂNĂ
  ro: {
    appTitle: "Găsește ajutorul medical de care ai nevoie",
    brand: "TimiCareNow",
    backHome: "Înapoi la pagina principală",
    languageLabel: "Limbă",

    // Start page
    landingTitle: "Găsește ajutorul medical de care ai nevoie",
    landingSubtitle: "Toate informațiile de care ai nevoie într-un singur loc.",
    landingSearchPlaceholder: "Ex: cardiologie, laborator analize, stomatolog, Dr. …",
    landingSearchButton: "Caută",
    landingCategoriesTitle: "Sau alege un domeniu medical",
    landingTypesTitle: "Sau caută după tipul unității",
    landingQuickTitle: "Filtre rapide",
    showAllMap: "Vezi toată harta →",
    placesCount: (n) => (n === 1 ? "1 locație" : n >= 20 ? `${n} de locații` : `${n} locații`),

    // Filters
    filtersTitle: "Filtre",
    reset: (n) => `Resetează (${n})`,
    filterSpecialties: "Specialități",
    filterType: "Tip unitate",
    groupSchedule: "Program",
    groupServices: "Servicii",
    filterMinScore: "Scor minim",
    scoreAny: "Orice",
    specialtySearch: "Caută o specialitate…",
    clinicsCount: (n) => (n === 1 ? "1 clinică" : n >= 20 ? `${n} de clinici` : `${n} clinici`),
    specialtyNoMatch: "Nicio specialitate găsită.",
    selectAll: "Selectează tot domeniul",
    unselectAll: "Deselectează tot domeniul",

    // Results
    resultsCount: (shown, total) => `Afișate: ${shown} din ${total}`,
    noResults: "Nicio locație nu corespunde căutării.",
    sortLabel: "Sortează",
    sortRelevance: "Relevanță",
    sortScore: "Scor (mare → mic)",
    sortReviews: "Cele mai multe evaluări",
    sortName: "Nume (A–Z)",

    // Search bar
    searchPlaceholder: "Caută clinici, specialități, medici…",
    searchButton: "Caută",
    clearSearch: "Șterge căutarea",

    // Floating buttons & windows
    infoButton: "Despre aplicație",
    accountButton: "Contul meu",
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
    auth0Intro: "Autentificarea se face securizat prin Auth0. Poți folosi email și parolă sau contul Google.",
    googleLogin: "Continuă cu Google",
    auth0Note: "Autentificare securizată prin Auth0.",

    // Saved places
    loggedInAs: "Conectat ca",
    savedTitle: "Locații salvate",
    savedEmpty: "Nu ai salvat nicio locație încă. Apasă „Salvează la favorite” în fereastra unei locații de pe hartă.",
    removeFavorite: "Elimină de la favorite",
    logout: "Deconectare",

    // Place popup & details
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
    independent: "Independent",
    approximateLocation: "Poziția pe hartă este aproximativă (pe stradă).",
    doctorsTitle: "Medici",
    daysShort: ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"],
    days: ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"],

    // Popular times & demand dashboard (Tiger Data)
    busyTitle: "Ore aglomerate",
    busyNow: {
      busier: "Acum: mai aglomerat decât de obicei",
      usual: "Acum: aglomerat ca de obicei",
      quieter: "Acum: mai liniștit decât de obicei",
      quiet: "Acum: de obicei liniștit",
    },
    busyBar: (hour, avg) => `${hour}:00 · în medie ${avg} contactări pe oră`,
    dataTiger: "Date reale · Tiger Data, în timp real",
    busyNotEnough: (n, min) => `Încă nu sunt destule date: ${n} din ${min} contactări necesare.`,
    statsLink: "Statistici în timp real",
    statsTitle: "Cererea de îngrijire medicală",
    statsSubtitle: "De câte ori sunt contactate clinicile din Timișoara, oră cu oră.",
    statsBack: "Înapoi",
    statsRange: { 1: "24 de ore", 7: "7 zile", 30: "30 de zile" },
    statsTotal: "Contactări",
    statsVsPrevious: (pct) => (pct >= 0 ? `+${pct}% față de perioada anterioară` : `${pct}% față de perioada anterioară`),
    statsChannels: { call: "Apeluri", whatsapp: "WhatsApp", email: "Email" },
    statsTimeline: "Contactări în timp",
    statsHeat: "Când caută oamenii îngrijire",
    statsHeatPeak: (day, hour) => `Cel mai aglomerat: ${day}, ${hour}:00`,
    statsTopPlaces: "Cele mai contactate clinici",
    statsPopular: "Cele mai populare clinici",
    statsViewed: "Cele mai vizitate",
    statsViewedNote: (n) => (n === 1 ? "1 deschidere a unei clinici pe site" : `${n} deschideri ale clinicilor pe site`),
    statsFavorites: "Adăugate la favorite",
    statsFavoritesNote: (n) => (n === 1 ? "1 clinică salvată la favorite în această perioadă" : `${n} clinici salvate la favorite în această perioadă`),
    statsFavoritesOff: "Favoritele apar aici când backend-ul este conectat la baza de date a conturilor.",
    statsNone: "Încă nu sunt date în această perioadă.",
    statsDomains: "Cerere pe domenii medicale",
    statsRecent: "Ultimele contactări",
    statsAgo: (min) => (min < 1 ? "acum" : min < 60 ? `acum ${min} min` : `acum ${Math.round(min / 60)} h`),
    statsTable: "Vezi ca tabel",
    statsTime: "Interval",
    statsLoading: "Se încarcă statisticile…",
    statsNoApi: "Statisticile au nevoie de backend (VITE_API_URL).",
    statsOff: "Statisticile nu sunt activate pe server (lipsește conexiunea la Tiger Data).",
    statsEmpty: "Încă nu sunt contactări în această perioadă. Fiecare apăsare pe Sună, WhatsApp sau Cere o programare apare aici în câteva secunde.",
    statsNoTrend: "Prima perioadă cu date",
    statsError: "Nu am putut încărca statisticile. Încearcă din nou.",
    statsStorage: "Stocare Tiger Data",
    statsStorageText: (chunks, compressed, pct) =>
      `${chunks} bucăți de date (chunks), ${compressed} comprimate${pct != null ? `, cu ${pct}% mai puțin spațiu` : ""}.`,

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
    publicRatings: "Evaluări publice",
    siteReviews: "Recenzii pe TimiCareNow",
    votes: (n) => (n === 1 ? "1 vot" : n >= 20 ? `${n} de voturi` : `${n} voturi`),
    noRatingsYet: "Încă nu există evaluări pentru această locație.",
    sourcesTitle: (n) => `Surse (${n})`,
    dataNote: "Date verificate din surse publice (13.11.2026). Confirmă programul telefonic înainte de vizită. În caz de urgență, sună la 112.",

    // Contact actions
    callButton: "Sună",
    whatsappButton: "WhatsApp",
    appointmentButton: "✉️ Cere o programare",
    appointmentHint: "Se deschide aplicația de email cu un mesaj gata scris.",
    appointmentSubject: (clinic) => `Cerere programare – ${clinic}`,
    appointmentBody: ({ clinic, specialty, name, email }) =>
      [
        "Bună ziua,",
        "",
        `Aș dori să fac o programare la ${clinic}${specialty ? `, pentru ${specialty}` : ""}.`,
        "",
        "Zile și ore preferate: ",
        `Nume: ${name ?? ""}`,
        "Telefon: ",
        email ? `Email: ${email}` : null,
        "",
        "Vă mulțumesc!",
      ]
        .filter((line) => line !== null)
        .join("\r\n"),
    whatsappMessage: ({ clinic, specialty }) =>
      `Bună ziua! Aș dori o programare la ${clinic}${specialty ? `, pentru ${specialty}` : ""}. Când ar fi un loc disponibil? Mulțumesc!`,

    // Accessible mode
    a11yButton: "Mod accesibil",
    a11yOn: "Mod accesibil: pornit",
    a11yOff: "Mod accesibil: oprit",

    // Chat assistant
    chatButton: "Asistent",
    chatTitle: "Asistent TimiCareNow",
    chatWelcome: "Bună! Spune-mi ce cauți sau ce te doare și îți găsesc clinica potrivită din Timișoara.",
    chatSuggestions: ["Pediatru deschis acum", "Mă doare o măsea", "Analize de sânge sâmbătă", "Spitale de urgență"],
    chatPlaceholder: "Scrie un mesaj…",
    chatSend: "Trimite",
    chatClear: "Conversație nouă",
    chatShowAll: (n) => (n === 1 ? "Arată pe hartă" : `Arată toate cele ${n} pe hartă`),
    chatAiNote: "Asistent AI · poate greși, verifică informațiile",
    chatLocalNote: "Mod simplu (fără AI)",
    chatError: "Asistentul AI nu a răspuns, așa că am căutat în modul simplu.",
    chatDisclaimer: "Nu înlocuiește un medic. În caz de urgență, sună la 112.",
    localFound: (n, names) =>
      `Am găsit ${n === 1 ? "o locație" : n >= 20 ? `${n} de locații` : `${n} locații`}${names.length ? ` pentru ${names.join(", ")}` : ""}. Apasă pe una ca s-o vezi pe hartă.`,
    localGeneric: (n) =>
      `Pentru o durere sau o stare de rău fără alte detalii, cel mai bine începi cu medicul de familie sau un medic de medicină internă. Am găsit ${n >= 20 ? `${n} de locații` : `${n} locații`}. Dacă îmi spui unde te doare (ex. „genunchiul”, „capul”, „burta”), îți recomand un specialist. Dacă durerea e foarte puternică sau a apărut brusc, sună la 112.`,
    localNone: "Nu am găsit nicio locație pentru asta. Încearcă altă formulare sau elimină „acum” / „weekend”.",
    localHelp:
      "Nu am înțeles exact. Poți scrie o specialitate (ex. „cardiologie”), un simptom (ex. „mă doare spatele”), numele unei clinici sau al unui medic.",
    localEmergency:
      "Ce descrii poate fi o urgență medicală. **Sună imediat la 112.** Mai jos sunt spitalele de urgență din Timișoara.",

    // Symptom guide
    symptomButton: "Ce te doare?",
    symptomTitle: "Ce te doare?",
    symptomIntro: "Alege sau scrie ce simți și îți arătăm la ce specialist să mergi.",
    symptomSearch: "Ex: durere de cap, tuse, erupție pe piele…",
    symptomEmergencyGroup: "Urgențe: sună imediat la 112",
    symptomCommonGroup: "Probleme frecvente",
    symptomNoMatch: "Nu am găsit acest simptom. Încearcă alt cuvânt sau începe cu medicul de familie.",
    symptomRecommend: "Specialități recomandate",
    symptomShowClinics: (n) => `Arată ${n === 1 ? "clinica" : `cele ${n} clinici`} pe hartă`,
    symptomCall112: "📞 Sună la 112",
    symptomEmergencyText:
      "Acesta poate fi un semn de urgență medicală. Sună imediat la 112 și nu te deplasa singur(ă) dacă nu te simți bine.",
    symptomShowEmergency: "Vezi spitalele de urgență",
    symptomUrgentText: "Mergi azi la medic. Îți arătăm unitățile deschise acum.",
    symptomBack: "← Înapoi la listă",
    symptomDisclaimer:
      "Ghidul te orientează spre specialitatea potrivită și nu înlocuiește un diagnostic medical. Dacă simptomele sunt grave sau se agravează, sună la 112.",
  },

  // ---------------------------------------------------------- ENGLISH
  en: {
    backHome: "Back to the start page",
    languageLabel: "Language",

    landingSubtitle: "All the information you need, in one place.",
    landingSearchPlaceholder: "E.g. cardiology, blood tests, dentist, Dr. …",
    landingSearchButton: "Search",
    landingCategoriesTitle: "Or choose a medical field",
    landingTypesTitle: "Or search by type of place",
    landingQuickTitle: "Quick filters",
    showAllMap: "See the whole map →",
    placesCount: (n) => (n === 1 ? "1 place" : `${n} places`),

    filtersTitle: "Filters",
    reset: (n) => `Reset (${n})`,
    filterSpecialties: "Specialties",
    filterType: "Type of place",
    groupSchedule: "Opening hours",
    groupServices: "Services",
    filterMinScore: "Minimum score",
    scoreAny: "Any",
    specialtySearch: "Search a specialty…",
    clinicsCount: (n) => (n === 1 ? "1 clinic" : `${n} clinics`),
    specialtyNoMatch: "No specialty found.",
    selectAll: "Select the whole field",
    unselectAll: "Unselect the whole field",

    resultsCount: (shown, total) => `Showing ${shown} of ${total}`,
    noResults: "No places match your search.",
    sortLabel: "Sort",
    sortRelevance: "Relevance",
    sortScore: "Score (high → low)",
    sortReviews: "Most ratings",
    sortName: "Name (A–Z)",

    searchPlaceholder: "Search clinics, specialties, doctors…",
    searchButton: "Search",
    clearSearch: "Clear search",

    infoButton: "About",
    accountButton: "My account",
    close: "Close",
    docsTitle: "About MedFinders",
    loginTitle: "Log in",
    accountTitle: "My account",

    email: "Email",
    password: "Password",
    loginButton: "Log in",
    registerButton: "Create account",
    switchToRegister: "No account? Create one",
    switchToLogin: "Already have an account? Log in",
    loginToSave: "Log in to save places to your favourites.",
    invalidEmail: "Enter a valid email address.",
    shortPassword: "The password must have at least 4 characters.",
    prototypeNote: "Prototype: the account is stored only in this browser.",
    auth0Intro: "Login is handled securely by Auth0. You can use email and password or your Google account.",
    googleLogin: "Continue with Google",
    auth0Note: "Secure login by Auth0.",

    loggedInAs: "Logged in as",
    savedTitle: "Saved places",
    savedEmpty: "You haven't saved any places yet. Press “Save to favourites” in a place's window on the map.",
    removeFavorite: "Remove from favourites",
    logout: "Log out",

    save: "☆ Save to favourites",
    saved: "★ Saved",
    hoursTitle: "Opening hours",
    openNow: "Open now",
    closedNow: "Closed now",
    closed: "Closed",
    notStated: "Not stated",
    nextDay: "(next day)",
    nonstop: "24 hours",
    hoursLoading: "Loading opening hours…",
    hoursUnavailable: "Opening hours unavailable",
    hoursFromGoogle: "Opening hours from Google Maps",
    contactTitle: "Contact",
    specialtiesTitle: "Specialties",
    servicesTitle: "Services",
    independent: "Independent",
    approximateLocation: "The map position is approximate (street level).",
    doctorsTitle: "Doctors",
    daysShort: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],

    // Popular times & demand dashboard (Tiger Data)
    busyTitle: "Popular times",
    busyNow: {
      busier: "Now: busier than usual",
      usual: "Now: as busy as usual",
      quieter: "Now: quieter than usual",
      quiet: "Now: usually quiet",
    },
    busyBar: (hour, avg) => `${hour}:00 · on average ${avg} contacts per hour`,
    dataTiger: "Real data · Tiger Data, in real time",
    busyNotEnough: (n, min) => `Not enough data yet: ${n} of ${min} contacts needed.`,
    statsLink: "Real-time statistics",
    statsTitle: "Demand for medical care",
    statsSubtitle: "How often clinics in Timișoara are contacted, hour by hour.",
    statsBack: "Back",
    statsRange: { 1: "24 hours", 7: "7 days", 30: "30 days" },
    statsTotal: "Contacts",
    statsVsPrevious: (pct) => (pct >= 0 ? `+${pct}% vs previous period` : `${pct}% vs previous period`),
    statsChannels: { call: "Calls", whatsapp: "WhatsApp", email: "Email" },
    statsTimeline: "Contacts over time",
    statsHeat: "When people look for care",
    statsHeatPeak: (day, hour) => `Busiest: ${day}, ${hour}:00`,
    statsTopPlaces: "Most contacted clinics",
    statsPopular: "Most popular clinics",
    statsViewed: "Most visited",
    statsViewedNote: (n) => (n === 1 ? "1 clinic opened on the site" : `${n} clinic openings on the site`),
    statsFavorites: "Added to favourites",
    statsFavoritesNote: (n) => (n === 1 ? "1 clinic saved to favourites in this period" : `${n} clinics saved to favourites in this period`),
    statsFavoritesOff: "Favourites show up here when the backend is connected to the accounts database.",
    statsNone: "No data in this period yet.",
    statsDomains: "Demand by medical domain",
    statsRecent: "Latest contacts",
    statsAgo: (min) => (min < 1 ? "now" : min < 60 ? `${min} min ago` : `${Math.round(min / 60)} h ago`),
    statsTable: "View as table",
    statsTime: "Period",
    statsLoading: "Loading statistics…",
    statsNoApi: "Statistics need the backend (VITE_API_URL).",
    statsOff: "Statistics aren't turned on on the server (no Tiger Data connection).",
    statsEmpty: "No contacts in this period yet. Every press on Call, WhatsApp or Request an appointment shows up here within seconds.",
    statsNoTrend: "First period with data",
    statsError: "Couldn't load the statistics. Try again.",
    statsStorage: "Tiger Data storage",
    statsStorageText: (chunks, compressed, pct) =>
      `${chunks} data chunks, ${compressed} compressed${pct != null ? `, using ${pct}% less space` : ""}.`,

    noScore: "New",
    reviewsButton: "Reviews & details",
    reviewsTitle: "Reviews",
    reviewsCount: (n) => (n === 0 ? "No ratings" : n === 1 ? "1 rating" : `${n} ratings`),
    noReviews: "No reviews on TimiCareNow yet. Be the first to write one!",
    writeReview: "Write a review",
    loginToReviewButton: "Log in to write a review",
    loginToReview: "Log in to write a review.",
    yourRating: "Your rating",
    yourReview: "Your review",
    reviewPlaceholder: "How was your experience? (staff, waiting time, cleanliness…)",
    submitReview: "Publish review",
    cancel: "Cancel",
    reviewNeedsRating: "Choose a rating from 1 to 5 stars.",
    reviewTooShort: "Write at least a few words.",
    yourReviewTag: "Your review",
    publicRatings: "Public ratings",
    siteReviews: "Reviews on TimiCareNow",
    votes: (n) => (n === 1 ? "1 vote" : `${n} votes`),
    noRatingsYet: "There are no ratings for this place yet.",
    sourcesTitle: (n) => `Sources (${n})`,
    dataNote: "Data checked against public sources (13 Nov 2026). Confirm the opening hours by phone before visiting. In an emergency, call 112.",

    callButton: "Call",
    whatsappButton: "WhatsApp",
    appointmentButton: "✉️ Request an appointment",
    appointmentHint: "Opens your email app with a ready-written message.",
    appointmentSubject: (clinic) => `Appointment request – ${clinic}`,
    appointmentBody: ({ clinic, specialty, name, email }) =>
      [
        "Hello,",
        "",
        `I would like to book an appointment at ${clinic}${specialty ? `, for ${specialty}` : ""}.`,
        "",
        "Preferred days and times: ",
        `Name: ${name ?? ""}`,
        "Phone: ",
        email ? `Email: ${email}` : null,
        "",
        "Thank you!",
      ]
        .filter((line) => line !== null)
        .join("\r\n"),
    whatsappMessage: ({ clinic, specialty }) =>
      `Hello! I would like to book an appointment at ${clinic}${specialty ? `, for ${specialty}` : ""}. When would there be a free slot? Thank you!`,

    a11yButton: "Accessible mode",
    a11yOn: "Accessible mode: on",
    a11yOff: "Accessible mode: off",

    chatButton: "Assistant",
    chatTitle: "TimiCareNow assistant",
    chatWelcome: "Hi! Tell me what you're looking for or what's wrong, and I'll find the right clinic in Timișoara.",
    chatSuggestions: ["Pediatrician open now", "I have a toothache", "Blood tests on Saturday", "Emergency hospitals"],
    chatPlaceholder: "Write a message…",
    chatSend: "Send",
    chatClear: "New conversation",
    chatShowAll: (n) => (n === 1 ? "Show on the map" : `Show all ${n} on the map`),
    chatAiNote: "AI assistant · can make mistakes, check the details",
    chatLocalNote: "Simple mode (no AI)",
    chatError: "The AI assistant didn't answer, so I searched in simple mode.",
    chatDisclaimer: "Not a substitute for a doctor. In an emergency, call 112.",
    localFound: (n, names) =>
      `I found ${n === 1 ? "1 place" : `${n} places`}${names.length ? ` for ${names.join(", ")}` : ""}. Tap one to see it on the map.`,
    localGeneric: (n) =>
      `For pain or feeling unwell without more details, it's best to start with a family doctor or an internal medicine doctor. I found ${n} places. If you tell me where it hurts (e.g. “knee”, “head”, “stomach”), I'll suggest a specialist. If the pain is very strong or came on suddenly, call 112.`,
    localNone: "I couldn't find any place for that. Try different words, or remove “now” / “weekend”.",
    localHelp:
      "I didn't quite understand. You can write a specialty (e.g. “cardiology”), a symptom (e.g. “back pain”), or the name of a clinic or doctor.",
    localEmergency:
      "What you describe may be a medical emergency. **Call 112 now.** Below are the emergency hospitals in Timișoara.",

    symptomButton: "What's wrong?",
    symptomTitle: "What's wrong?",
    symptomIntro: "Pick or type what you feel and we'll show you which specialist to see.",
    symptomSearch: "E.g. headache, cough, skin rash…",
    symptomEmergencyGroup: "Emergencies: call 112 now",
    symptomCommonGroup: "Common problems",
    symptomNoMatch: "We couldn't find this symptom. Try another word, or start with a family doctor.",
    symptomRecommend: "Recommended specialties",
    symptomShowClinics: (n) => `Show ${n === 1 ? "the clinic" : `the ${n} clinics`} on the map`,
    symptomCall112: "📞 Call 112",
    symptomEmergencyText:
      "This may be a sign of a medical emergency. Call 112 now and don't travel alone if you feel unwell.",
    symptomShowEmergency: "See emergency hospitals",
    symptomUrgentText: "See a doctor today. We'll show you the places open right now.",
    symptomBack: "← Back to the list",
    symptomDisclaimer:
      "This guide points you to the right specialty and does not replace a medical diagnosis. If symptoms are severe or getting worse, call 112.",
  },

  // ---------------------------------------------------------- MAGYAR
  hu: {
    backHome: "Vissza a kezdőlapra",
    languageLabel: "Nyelv",

    landingSubtitle: "Minden információ, amire szükséged van, egy helyen.",
    landingSearchPlaceholder: "Pl. kardiológia, vérvétel, fogorvos, Dr. …",
    landingSearchButton: "Keresés",
    landingCategoriesTitle: "Vagy válassz egy orvosi területet",
    landingTypesTitle: "Vagy keress az intézmény típusa szerint",
    landingQuickTitle: "Gyors szűrők",
    showAllMap: "A teljes térkép →",
    placesCount: (n) => `${n} hely`,

    filtersTitle: "Szűrők",
    reset: (n) => `Törlés (${n})`,
    filterSpecialties: "Szakterületek",
    filterType: "Intézmény típusa",
    groupSchedule: "Nyitvatartás",
    groupServices: "Szolgáltatások",
    filterMinScore: "Minimális pontszám",
    scoreAny: "Bármely",
    specialtySearch: "Szakterület keresése…",
    clinicsCount: (n) => `${n} klinika`,
    specialtyNoMatch: "Nincs ilyen szakterület.",
    selectAll: "Az egész terület kiválasztása",
    unselectAll: "Az egész terület törlése",

    resultsCount: (shown, total) => `${total} helyből ${shown} látható`,
    noResults: "Egy hely sem felel meg a keresésnek.",
    sortLabel: "Rendezés",
    sortRelevance: "Relevancia",
    sortScore: "Pontszám (magas → alacsony)",
    sortReviews: "Legtöbb értékelés",
    sortName: "Név (A–Z)",

    searchPlaceholder: "Klinikák, szakterületek, orvosok keresése…",
    searchButton: "Keresés",
    clearSearch: "Keresés törlése",

    infoButton: "Az alkalmazásról",
    accountButton: "Fiókom",
    close: "Bezárás",
    docsTitle: "A MedFinders-ről",
    loginTitle: "Bejelentkezés",
    accountTitle: "Fiókom",

    email: "E-mail",
    password: "Jelszó",
    loginButton: "Bejelentkezés",
    registerButton: "Fiók létrehozása",
    switchToRegister: "Nincs fiókod? Hozz létre egyet",
    switchToLogin: "Van már fiókod? Jelentkezz be",
    loginToSave: "Jelentkezz be, hogy helyeket menthess a kedvencek közé.",
    invalidEmail: "Adj meg egy érvényes e-mail-címet.",
    shortPassword: "A jelszónak legalább 4 karakterből kell állnia.",
    prototypeNote: "Prototípus: a fiók csak ebben a böngészőben van tárolva.",
    auth0Intro: "A bejelentkezést biztonságosan az Auth0 kezeli. Használhatsz e-mailt és jelszót vagy Google-fiókot.",
    googleLogin: "Folytatás Google-lal",
    auth0Note: "Biztonságos bejelentkezés: Auth0.",

    loggedInAs: "Bejelentkezve:",
    savedTitle: "Mentett helyek",
    savedEmpty: "Még nem mentettél helyet. Nyomd meg a „Mentés a kedvencek közé” gombot egy hely ablakában.",
    removeFavorite: "Eltávolítás a kedvencek közül",
    logout: "Kijelentkezés",

    save: "☆ Mentés a kedvencek közé",
    saved: "★ Elmentve",
    hoursTitle: "Nyitvatartás",
    openNow: "Most nyitva",
    closedNow: "Most zárva",
    closed: "Zárva",
    notStated: "Nincs megadva",
    nextDay: "(másnap)",
    nonstop: "Éjjel-nappal",
    hoursLoading: "Nyitvatartás betöltése…",
    hoursUnavailable: "A nyitvatartás nem elérhető",
    hoursFromGoogle: "Nyitvatartás a Google Térképről",
    contactTitle: "Elérhetőség",
    specialtiesTitle: "Szakterületek",
    servicesTitle: "Szolgáltatások",
    independent: "Független",
    approximateLocation: "A térképen jelölt hely csak hozzávetőleges (utcaszintű).",
    doctorsTitle: "Orvosok",
    daysShort: ["H", "K", "Sze", "Cs", "P", "Szo", "V"],
    days: ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"],

    noScore: "Új",
    reviewsButton: "Vélemények és részletek",
    reviewsTitle: "Vélemények",
    reviewsCount: (n) => (n === 0 ? "Nincs értékelés" : `${n} értékelés`),
    noReviews: "Még nincs vélemény a TimiCareNow-n. Írd meg te az elsőt!",
    writeReview: "Vélemény írása",
    loginToReviewButton: "Jelentkezz be a véleményíráshoz",
    loginToReview: "Jelentkezz be a véleményíráshoz.",
    yourRating: "Értékelésed",
    yourReview: "Véleményed",
    reviewPlaceholder: "Milyen volt a tapasztalatod? (személyzet, várakozási idő, tisztaság…)",
    submitReview: "Vélemény közzététele",
    cancel: "Mégse",
    reviewNeedsRating: "Válassz 1 és 5 csillag közötti értékelést.",
    reviewTooShort: "Írj legalább néhány szót.",
    yourReviewTag: "A te véleményed",
    publicRatings: "Nyilvános értékelések",
    siteReviews: "Vélemények a TimiCareNow-n",
    votes: (n) => `${n} szavazat`,
    noRatingsYet: "Ennek a helynek még nincs értékelése.",
    sourcesTitle: (n) => `Források (${n})`,
    dataNote: "Nyilvános forrásokból ellenőrzött adatok (2026.11.13.). Látogatás előtt telefonon erősítsd meg a nyitvatartást. Vészhelyzetben hívd a 112-t.",

    callButton: "Hívás",
    whatsappButton: "WhatsApp",
    appointmentButton: "✉️ Időpontkérés",
    appointmentHint: "Megnyitja az e-mail-alkalmazást egy előre megírt üzenettel.",
    appointmentSubject: (clinic) => `Időpontkérés – ${clinic}`,
    appointmentBody: ({ clinic, specialty, name, email }) =>
      [
        "Jó napot kívánok!",
        "",
        `Szeretnék időpontot kérni ide: ${clinic}${specialty ? `, ${specialty}` : ""}.`,
        "",
        "Előnyös napok és időpontok: ",
        `Név: ${name ?? ""}`,
        "Telefon: ",
        email ? `E-mail: ${email}` : null,
        "",
        "Köszönöm!",
      ]
        .filter((line) => line !== null)
        .join("\r\n"),
    whatsappMessage: ({ clinic, specialty }) =>
      `Jó napot! Szeretnék időpontot kérni ide: ${clinic}${specialty ? `, ${specialty}` : ""}. Mikor lenne szabad időpont? Köszönöm!`,

    a11yButton: "Akadálymentes mód",
    a11yOn: "Akadálymentes mód: be",
    a11yOff: "Akadálymentes mód: ki",

    chatButton: "Asszisztens",
    chatTitle: "TimiCareNow asszisztens",
    chatWelcome: "Szia! Mondd el, mit keresel vagy mi a panaszod, és megkeresem a megfelelő temesvári klinikát.",
    chatSuggestions: ["Most nyitva tartó gyermekorvos", "Fáj a fogam", "Vérvétel szombaton", "Sürgősségi kórházak"],
    chatPlaceholder: "Írj egy üzenetet…",
    chatSend: "Küldés",
    chatClear: "Új beszélgetés",
    chatShowAll: (n) => (n === 1 ? "Megjelenítés a térképen" : `Mind a ${n} megjelenítése a térképen`),
    chatAiNote: "MI-asszisztens · tévedhet, ellenőrizd az adatokat",
    chatLocalNote: "Egyszerű mód (MI nélkül)",
    chatError: "Az MI-asszisztens nem válaszolt, ezért egyszerű módban kerestem.",
    chatDisclaimer: "Nem helyettesíti az orvost. Vészhelyzetben hívd a 112-t.",
    localFound: (n, names) =>
      `${n} helyet találtam${names.length ? ` (${names.join(", ")})` : ""}. Koppints egyre, hogy lásd a térképen.`,
    localGeneric: (n) =>
      `Fájdalom vagy rossz közérzet esetén, további részletek nélkül, érdemes háziorvossal vagy belgyógyásszal kezdeni. ${n} helyet találtam. Ha megírod, hol fáj (pl. „térd”, „fej”, „has”), szakorvost ajánlok. Ha a fájdalom nagyon erős vagy hirtelen jelentkezett, hívd a 112-t.`,
    localNone: "Nem találtam ilyen helyet. Próbálj más szavakat, vagy hagyd el a „most” / „hétvége” szót.",
    localHelp:
      "Nem egészen értettem. Írhatsz szakterületet (pl. „kardiológia”), tünetet (pl. „hátfájás”), vagy egy klinika vagy orvos nevét.",
    localEmergency:
      "Amit leírsz, orvosi vészhelyzet lehet. **Azonnal hívd a 112-t.** Lent a temesvári sürgősségi kórházak láthatók.",

    symptomButton: "Mi a panaszod?",
    symptomTitle: "Mi a panaszod?",
    symptomIntro: "Válaszd ki vagy írd be, mit érzel, és megmutatjuk, melyik szakorvoshoz fordulj.",
    symptomSearch: "Pl. fejfájás, köhögés, bőrkiütés…",
    symptomEmergencyGroup: "Vészhelyzet: azonnal hívd a 112-t",
    symptomCommonGroup: "Gyakori panaszok",
    symptomNoMatch: "Nem találtuk ezt a tünetet. Próbálj más szót, vagy kezdd a háziorvosnál.",
    symptomRecommend: "Javasolt szakterületek",
    symptomShowClinics: (n) => `${n} klinika megjelenítése a térképen`,
    symptomCall112: "📞 Hívd a 112-t",
    symptomEmergencyText:
      "Ez orvosi vészhelyzet jele lehet. Azonnal hívd a 112-t, és ne indulj el egyedül, ha rosszul érzed magad.",
    symptomShowEmergency: "Sürgősségi kórházak",
    symptomUrgentText: "Még ma fordulj orvoshoz. Megmutatjuk a most nyitva tartó helyeket.",
    symptomBack: "← Vissza a listához",
    symptomDisclaimer:
      "Ez az útmutató a megfelelő szakterület felé irányít, de nem helyettesíti az orvosi diagnózist. Ha a tünetek súlyosak vagy rosszabbodnak, hívd a 112-t.",
  },
};

// ---------- Current language ----------
const STORAGE_KEY = "timicarenow:language";

function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TEXTS[saved]) return saved;
  } catch {
    // ignore
  }
  return "ro";
}

let current = initialLanguage();

export function getLanguage() {
  return current;
}

export function setLanguage(lang) {
  if (!TEXTS[lang]) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

// Pick a value from { ro, en, hu } in the current language (falls back to ro)
export function pick(values) {
  return values?.[current] ?? values?.ro;
}

// TEXT.someKey -> text in the current language (falls back to Romanian)
export const TEXT = new Proxy(
  {},
  {
    get: (_, key) => TEXTS[current][key] ?? TEXTS.ro[key],
  }
);
