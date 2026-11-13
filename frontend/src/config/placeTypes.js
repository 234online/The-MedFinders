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
  { id: "dentist",    label: "Cabinete stomatologice", icon: "🦷", color: "#0ea5e9" },
  { id: "laboratory", label: "Laboratoare de analize", icon: "🔬", color: "#9333ea" },
  { id: "optician",   label: "Optică medicală",   icon: "👓", color: "#d97706" },
];

// Yes/no services. Each becomes an on/off switch in the filters and a
// badge in the popup.   id -> field name in places.json ("open24h": true)
export const FEATURES = [
  { id: "open24h",       label: "Deschis non-stop" },
  { id: "emergency",     label: "Urgențe (UPU)" },
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
    label: "Medicină generală și internă",
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
    label: "Cardiologie, pneumologie și alergologie",
    icon: "❤️",
    color: "#dc2626",
    items: ["Cardiologie", "Pneumologie", "Alergologie"],
  },
  {
    id: "internal",
    label: "Specialități medicale interne",
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
    label: "Specialități chirurgicale",
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
    label: "Neurologie și psihiatrie",
    icon: "🧠",
    color: "#7c3aed",
    items: ["Neurologie", "Psihiatrie", "Psihologie / Psihoterapie"],
  },
  {
    id: "mother-child",
    label: "Obstetrică, ginecologie și pediatrie",
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
    label: "Medicină dentară",
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
    label: "Oftalmologie, ORL și dermatologie",
    icon: "👁️",
    color: "#2563eb",
    items: ["Oftalmologie", "ORL", "Dermatovenerologie"],
  },
  {
    id: "oncology",
    label: "Oncologie și radioterapie",
    icon: "🎗️",
    color: "#e11d48",
    items: ["Oncologie", "Radioterapie"],
  },
  {
    id: "diagnostics",
    label: "Diagnostic paraclinic și imagistică",
    icon: "🔬",
    color: "#4f46e5",
    items: ["Laborator analize medicale", "Imagistică (RMN, radiologie)", "Genetică medicală"],
  },
  {
    id: "recovery",
    label: "Recuperare medicală și terapii",
    icon: "🏃",
    color: "#16a34a",
    items: ["Recuperare medicală / Kinetoterapie", "Logopedie"],
  },
];

// All specialties in one flat list
export const SPECIALTIES = SPECIALTY_GROUPS.flatMap((g) => g.items);

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
