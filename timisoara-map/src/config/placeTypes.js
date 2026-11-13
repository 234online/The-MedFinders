// =============================================================
//  The "vocabulary" of the app: what kinds of places exist,
//  which services they can have, and which areas there are.
//  Edit these lists to change what shows up in the filters.
// =============================================================

// Place categories.
//   id    -> the value used in places.json ("category": "pharmacy")
//   label -> text shown in the filter chips, list and popups
//   (ids stay in English: they are only used in code and data, never shown)
//   color -> marker and chip colour
export const CATEGORIES = [
  { id: "hospital",   label: "Spitale",           color: "#dc2626" },
  { id: "clinic",     label: "Clinici",           color: "#2563eb" },
  { id: "pharmacy",   label: "Farmacii",          color: "#16a34a" },
  { id: "doctor",     label: "Medici de familie", color: "#0891b2" },
  { id: "dentist",    label: "Stomatologie",      color: "#9333ea" },
  { id: "laboratory", label: "Laboratoare",       color: "#ea580c" },
  { id: "optician",   label: "Optică",            color: "#c026d3" },
];

// Yes/no services. Each one becomes an on/off switch in the filters
// and a badge in the popup.
//   id -> the field name in places.json ("open24h": true)
export const FEATURES = [
  { id: "open24h",    label: "Deschis non-stop" },
  { id: "emergency",  label: "Urgențe (UPU)" },
  { id: "wheelchair", label: "Acces scaun rulant" },
  { id: "cnas",       label: "În contract cu CNAS" },
];

// Neighbourhoods for the area dropdown. Must match "area" in places.json.
export const AREAS = [
  "Cetate",
  "Fabric",
  "Iosefin",
  "Elisabetin",
  "Complexul Studențesc",
  "Circumvalațiunii",
];

// Used for places whose category isn't in the list above
const FALLBACK_CATEGORY = { id: "other", label: "Altele", color: "#6b7280" };

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) ?? FALLBACK_CATEGORY;
}
