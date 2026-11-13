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

// =============================================================
//  SPECIALTIES, grouped into domains (filter + subfilters).
//  Field "specialties" in places.json is a list of these names,
//  written exactly the same way.
//  To add a specialty: add it to a group's "items".
//  To add a domain: add a new { id, label, icon, color, items } object.
// =============================================================
export const SPECIALTY_GROUPS = [
  {
    id: "general",
    label: "Medicină generală",
    icon: "🩺",
    color: "#0d9488",
    items: [
      "Medicina familiei",
      "Medicină internă",
      "Medicina muncii",
      "Boli infecțioase",
      "Îngrijiri paliative",
    ],
  },
  {
    id: "heart-lungs",
    label: "Inimă, plămâni și alergii",
    icon: "❤️",
    color: "#dc2626",
    items: ["Cardiologie", "Pneumologie", "Alergologie"],
  },
  {
    id: "internal",
    label: "Boli interne și metabolice",
    icon: "🧪",
    color: "#ca8a04",
    items: [
      "Endocrinologie",
      "Diabet, nutriție și boli metabolice",
      "Gastroenterologie",
      "Nefrologie / Dializă",
      "Hematologie",
      "Reumatologie",
    ],
  },
  {
    id: "surgery",
    label: "Chirurgie",
    icon: "🔪",
    color: "#475569",
    items: [
      "Chirurgie generală",
      "Chirurgie plastică",
      "Chirurgie vasculară",
      "Ortopedie-Traumatologie",
      "Urologie",
      "Anestezie",
    ],
  },
  {
    id: "neuro-mental",
    label: "Neurologie și sănătate mintală",
    icon: "🧠",
    color: "#7c3aed",
    items: ["Neurologie", "Psihiatrie", "Psihologie / Psihoterapie"],
  },
  {
    id: "mother-child",
    label: "Mamă și copil",
    icon: "👶",
    color: "#db2777",
    items: [
      "Pediatrie",
      "Neurologie pediatrică",
      "Neonatologie",
      "Obstetrică-Ginecologie",
      "Reproducere umană asistată",
    ],
  },
  {
    id: "dental",
    label: "Stomatologie",
    icon: "🦷",
    color: "#0ea5e9",
    items: [
      "Stomatologie",
      "Stomatologie pediatrică",
      "Ortodonție",
      "Implantologie",
      "Radiologie dentară",
    ],
  },
  {
    id: "senses-skin",
    label: "Ochi, ORL și piele",
    icon: "👁️",
    color: "#2563eb",
    items: ["Oftalmologie", "ORL", "Dermatovenerologie"],
  },
  {
    id: "oncology",
    label: "Oncologie",
    icon: "🎗️",
    color: "#e11d48",
    items: ["Oncologie", "Radioterapie"],
  },
  {
    id: "diagnostics",
    label: "Diagnostic și investigații",
    icon: "🔬",
    color: "#4f46e5",
    items: ["Laborator analize medicale", "Imagistică (RMN, radiologie)", "Genetică medicală"],
  },
  {
    id: "recovery",
    label: "Recuperare și terapie",
    icon: "🏃",
    color: "#16a34a",
    items: ["Recuperare medicală / Kinetoterapie", "Logopedie"],
  },
];

// All specialties in one flat list
export const SPECIALTIES = SPECIALTY_GROUPS.flatMap((g) => g.items);

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
