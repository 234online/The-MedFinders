// =============================================================
//  The "vocabulary" of the app: what kinds of places exist,
//  which services they can have, and the options for each filter.
//  Edit these lists to change what shows up in the filters.
//  (ids stay in English: they're used in code and data, never shown)
// =============================================================

// Place categories.
//   id    -> the value used in places.json ("category": "pharmacy")
//   label -> text shown in chips, the list, popups
//   icon  -> emoji shown on map pins, chips and tiles
//   color -> pin and chip colour
export const CATEGORIES = [
  { id: "hospital",   label: "Spitale",           icon: "🏥", color: "#dc2626" },
  { id: "clinic",     label: "Clinici",           icon: "🩺", color: "#2563eb" },
  { id: "pharmacy",   label: "Farmacii",          icon: "💊", color: "#16a34a" },
  { id: "doctor",     label: "Medici de familie", icon: "🧑‍⚕️", color: "#0d9488" },
  { id: "dentist",    label: "Stomatologie",      icon: "🦷", color: "#0ea5e9" },
  { id: "laboratory", label: "Laboratoare",       icon: "🔬", color: "#9333ea" },
  { id: "optician",   label: "Optică",            icon: "👓", color: "#d97706" },
];

// Yes/no services. Each becomes an on/off switch in the filters and a
// badge in the popup.   id -> field name in places.json ("open24h": true)
export const FEATURES = [
  { id: "open24h",       label: "Deschis non-stop" },
  { id: "emergency",     label: "Urgențe (UPU)" },
  { id: "cnas",          label: "În contract cu CNAS" },
  { id: "wheelchair",    label: "Acces scaun rulant" },
  { id: "onlineBooking", label: "Programare online" },
  { id: "parking",       label: "Parcare" },
  { id: "kids",          label: "Potrivit pentru copii" },
];

// Specialties (field "specialties" in places.json: a list of these)
export const SPECIALTIES = [
  "analize medicale",
  "cardiologie",
  "chirurgie",
  "dermatologie",
  "medicină de familie",
  "medicină generală",
  "neurologie",
  "oftalmologie",
  "ORL",
  "ortopedie",
  "pediatrie",
  "stomatologie",
];

// Languages spoken (field "languages": list of ids)
export const LANGUAGES = [
  { id: "ro", label: "Română" },
  { id: "en", label: "Engleză" },
  { id: "hu", label: "Maghiară" },
  { id: "de", label: "Germană" },
  { id: "sr", label: "Sârbă" },
];

// Price levels (field "priceLevel": 1, 2 or 3)
export const PRICE_LEVELS = [
  { id: 1, label: "€ Accesibil" },
  { id: 2, label: "€€ Mediu" },
  { id: 3, label: "€€€ Premium" },
];

// Neighbourhoods for the area dropdown (field "area")
export const AREAS = [
  "Cetate",
  "Fabric",
  "Iosefin",
  "Elisabetin",
  "Complexul Studențesc",
  "Circumvalațiunii",
];

// ---------- PLACEHOLDERS: rename / replace these later ----------
// Used by the "Placeholder" filter group (fields placeholder_2 and placeholder_3)
export const PLACEHOLDER_2_OPTIONS = ["placeholder_a", "placeholder_b", "placeholder_c"];
export const PLACEHOLDER_3_OPTIONS = ["placeholder_x", "placeholder_y", "placeholder_z"];

// Used for places whose category isn't in the list above
const FALLBACK_CATEGORY = { id: "other", label: "Altele", icon: "📍", color: "#6b7280" };

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) ?? FALLBACK_CATEGORY;
}

export function getLanguage(id) {
  return LANGUAGES.find((l) => l.id === id)?.label ?? id;
}

export function getPriceLevel(id) {
  return PRICE_LEVELS.find((p) => p.id === id)?.label ?? "";
}
