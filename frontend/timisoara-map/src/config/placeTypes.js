import data from "../data/clinics.json";

// =============================================================
//  The "vocabulary" of the app. Most of it now comes from the
//  database export (src/data/clinics.json); this file only adds
//  Romanian labels, icons and colours.
//  (ids/codes stay in English: they're the database's values)
// =============================================================

// Types of place = clinics.kind in the database.
//   id    -> the database value ("hospital", "dental", ...)
//   label -> text shown in chips, the list, popups (plural)
//   singular -> one place of this type
//   icon  -> emoji on map pins, chips and tiles
//   color -> pin and chip colour
export const CATEGORIES = [
  { id: "hospital",          label: "Spitale", singular: "Spital",                icon: "🏥", color: "#dc2626" },
  { id: "polyclinic",        label: "Policlinici", singular: "Policlinică",            icon: "🏢", color: "#4f46e5" },
  { id: "clinic",            label: "Clinici", singular: "Clinică",                icon: "🩺", color: "#2563eb" },
  { id: "university clinic", label: "Clinici universitare", singular: "Clinică universitară",   icon: "🎓", color: "#a16207" },
  { id: "dental",            label: "Clinici stomatologice", singular: "Clinică stomatologică",  icon: "🦷", color: "#0ea5e9" },
  { id: "laboratory",        label: "Laboratoare de analize", singular: "Laborator de analize", icon: "🔬", color: "#9333ea" },
  { id: "imaging",           label: "Centre de imagistică", singular: "Centru de imagistică",   icon: "🧲", color: "#475569" },
  { id: "practice",          label: "Cabinete individuale", singular: "Cabinet individual",   icon: "🧑‍⚕️", color: "#0d9488" },
];

// Types that actually appear in the data (others are hidden in the filters)
export const USED_KINDS = new Set(data.clinics.map((c) => c.kind));

// clinics.ownership
export const OWNERSHIP = [
  { id: "public", label: "De stat" },
  { id: "private", label: "Privat" },
  { id: "ngo", label: "ONG" },
];

// Yes/no facts worked out from the database (see src/data/loadPlaces.js).
// Each becomes a switch in the filters and a badge in the popup.
export const FEATURES = [
  { id: "open24h", label: "Deschis non-stop" },
  { id: "emergency", label: "Spital de urgență" },
  { id: "weekend", label: "Deschis în weekend" },
  { id: "kids", label: "Pentru copii" },
];

// =============================================================
//  SPECIALTY GROUPS = specialties.category_ro in the database.
//  The groups and their specialties come from the database; here
//  you only choose the order, icon and colour of each group.
//  A new category in the database appears automatically at the end.
// =============================================================
const GROUP_STYLES = [
  { category: "Medicină generală",     icon: "🩺", color: "#0d9488" },
  { category: "Specialități medicale", icon: "❤️", color: "#2563eb" },
  { category: "Chirurgie",             icon: "🔪", color: "#475569" },
  { category: "Femei și copii",        icon: "👶", color: "#db2777" },
  { category: "Sănătate mintală",      icon: "🧠", color: "#7c3aed" },
  { category: "Stomatologie",          icon: "🦷", color: "#0ea5e9" },
  { category: "Oncologie",             icon: "🎗️", color: "#e11d48" },
  { category: "Analize și recuperare", icon: "🔬", color: "#4f46e5" },
];
const DEFAULT_GROUP_STYLE = { icon: "➕", color: "#6b7280" };

// code -> specialty row ({ code, name_ro, name_en, category_ro, ... })
export const SPECIALTY_BY_CODE = Object.fromEntries(data.specialties.map((s) => [s.code, s]));

const categories = [...new Set(data.specialties.map((s) => s.category_ro))].sort((a, b) => {
  const ia = GROUP_STYLES.findIndex((g) => g.category === a);
  const ib = GROUP_STYLES.findIndex((g) => g.category === b);
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
});

export const SPECIALTY_GROUPS = categories.map((category) => {
  const style = GROUP_STYLES.find((g) => g.category === category) ?? DEFAULT_GROUP_STYLE;
  return {
    id: category,
    label: category,
    icon: style.icon,
    color: style.color,
    items: data.specialties
      .filter((s) => s.category_ro === category)
      .map((s) => s.name_ro)
      .sort((a, b) => a.localeCompare(b, "ro")),
  };
});

// All specialties in one flat list (Romanian names)
export const SPECIALTIES = SPECIALTY_GROUPS.flatMap((g) => g.items);

// Specialties that make a place "Pentru copii"
export const KIDS_SPECIALTIES = [
  "Pediatrie",
  "Neonatologie",
  "Neurologie pediatrică",
  "Stomatologie pediatrică",
];

// Networks (clinics.network), most common first, "Independent" last
export const NETWORKS = (() => {
  const counts = {};
  for (const c of data.clinics) counts[c.network] = (counts[c.network] ?? 0) + 1;
  return Object.keys(counts).sort((a, b) => {
    if (a === "Independent") return 1;
    if (b === "Independent") return -1;
    return counts[b] - counts[a] || a.localeCompare(b);
  });
})();

// Used for places whose kind isn't in the list above
const FALLBACK_CATEGORY = { id: "other", label: "Altele", singular: "Unitate medicală", icon: "📍", color: "#6b7280" };

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) ?? FALLBACK_CATEGORY;
}

export function getOwnership(id) {
  return OWNERSHIP.find((o) => o.id === id)?.label ?? id;
}
