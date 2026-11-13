import data from "../data/clinics.json";
import { pick, getLanguage } from "./texts.js";

// =============================================================
//  The "vocabulary" of the app. Most of it comes from the database
//  export (src/data/clinics.json); this file adds labels in three
//  languages (ro / en / hu), icons and colours.
//  "label" is a getter: it always returns the current language.
//  (ids/codes stay in English: they're the database's values)
// =============================================================

// Gives an object "label"/"singular" getters from its { ro, en, hu } texts
function withLabels(item) {
  return Object.defineProperties(item, {
    label: { get: () => pick(item.labels), enumerable: true },
    singular: { get: () => pick(item.singulars ?? item.labels), enumerable: true },
  });
}

// Types of place = clinics.kind in the database
export const CATEGORIES = [
  { id: "hospital", icon: "🏥", color: "#dc2626",
    labels: { ro: "Spitale", en: "Hospitals", hu: "Kórházak" },
    singulars: { ro: "Spital", en: "Hospital", hu: "Kórház" } },
  { id: "polyclinic", icon: "🏢", color: "#4f46e5",
    labels: { ro: "Policlinici", en: "Polyclinics", hu: "Rendelőintézetek" },
    singulars: { ro: "Policlinică", en: "Polyclinic", hu: "Rendelőintézet" } },
  { id: "clinic", icon: "🩺", color: "#2563eb",
    labels: { ro: "Clinici", en: "Clinics", hu: "Klinikák" },
    singulars: { ro: "Clinică", en: "Clinic", hu: "Klinika" } },
  { id: "university clinic", icon: "🎓", color: "#a16207",
    labels: { ro: "Clinici universitare", en: "University clinics", hu: "Egyetemi klinikák" },
    singulars: { ro: "Clinică universitară", en: "University clinic", hu: "Egyetemi klinika" } },
  { id: "dental", icon: "🦷", color: "#0ea5e9",
    labels: { ro: "Clinici stomatologice", en: "Dental clinics", hu: "Fogászati klinikák" },
    singulars: { ro: "Clinică stomatologică", en: "Dental clinic", hu: "Fogászati klinika" } },
  { id: "laboratory", icon: "🔬", color: "#9333ea",
    labels: { ro: "Laboratoare de analize", en: "Laboratories", hu: "Laboratóriumok" },
    singulars: { ro: "Laborator de analize", en: "Laboratory", hu: "Laboratórium" } },
  { id: "imaging", icon: "🧲", color: "#475569",
    labels: { ro: "Centre de imagistică", en: "Imaging centres", hu: "Képalkotó központok" },
    singulars: { ro: "Centru de imagistică", en: "Imaging centre", hu: "Képalkotó központ" } },
  { id: "practice", icon: "🧑‍⚕️", color: "#0d9488",
    labels: { ro: "Cabinete individuale", en: "Private practices", hu: "Magánrendelők" },
    singulars: { ro: "Cabinet individual", en: "Private practice", hu: "Magánrendelő" } },
].map(withLabels);

// Types that actually appear in the data (others are hidden in the filters)
export const USED_KINDS = new Set(data.clinics.map((c) => c.kind));

// clinics.ownership
export const OWNERSHIP = [
  { id: "public", labels: { ro: "De stat", en: "Public", hu: "Állami" } },
  { id: "private", labels: { ro: "Privat", en: "Private", hu: "Magán" } },
  { id: "ngo", labels: { ro: "ONG", en: "NGO", hu: "Civil szervezet" } },
].map(withLabels);

// Yes/no facts worked out from the database (see src/data/loadPlaces.js)
export const FEATURES = [
  { id: "open24h", labels: { ro: "Deschis non-stop", en: "Open 24/7", hu: "Éjjel-nappal nyitva" } },
  { id: "emergency", labels: { ro: "Spital de urgență", en: "Emergency hospital", hu: "Sürgősségi kórház" } },
  { id: "weekend", labels: { ro: "Deschis în weekend", en: "Open at weekends", hu: "Hétvégén nyitva" } },
  { id: "kids", labels: { ro: "Pentru copii", en: "For children", hu: "Gyermekeknek" } },
].map(withLabels);

// =============================================================
//  SPECIALTIES (from the database)
//  Romanian names (name_ro) are used as ids inside the app.
//  English names come from the database (name_en); Hungarian
//  names are below. A missing translation falls back to Romanian.
// =============================================================
const SPECIALTY_HU = {
  "Alergologie": "Allergológia",
  "Anestezie": "Aneszteziológia",
  "Boli infecțioase": "Fertőző betegségek",
  "Cardiologie": "Kardiológia",
  "Chirurgie generală": "Általános sebészet",
  "Chirurgie plastică": "Plasztikai sebészet",
  "Chirurgie vasculară": "Érsebészet",
  "Dermatovenerologie": "Bőrgyógyászat",
  "Diabet, nutriție și boli metabolice": "Diabetológia és anyagcsere-betegségek",
  "Endocrinologie": "Endokrinológia",
  "Gastroenterologie": "Gasztroenterológia",
  "Genetică medicală": "Orvosi genetika",
  "Hematologie": "Hematológia",
  "Imagistică (RMN, radiologie)": "Képalkotás (MRI, röntgen)",
  "Implantologie": "Implantológia",
  "Îngrijiri paliative": "Palliatív ellátás",
  "Laborator analize medicale": "Orvosi laboratórium",
  "Logopedie": "Logopédia",
  "Medicina familiei": "Háziorvoslás",
  "Medicina muncii": "Foglalkozás-egészségügy",
  "Medicină internă": "Belgyógyászat",
  "Nefrologie / Dializă": "Nefrológia / Dialízis",
  "Neonatologie": "Neonatológia",
  "Neurologie": "Neurológia",
  "Neurologie pediatrică": "Gyermekneurológia",
  "Obstetrică-Ginecologie": "Szülészet-nőgyógyászat",
  "Oftalmologie": "Szemészet",
  "Oncologie": "Onkológia",
  "ORL": "Fül-orr-gégészet",
  "Ortodonție": "Fogszabályozás",
  "Ortopedie-Traumatologie": "Ortopédia-traumatológia",
  "Pediatrie": "Gyermekgyógyászat",
  "Pneumologie": "Tüdőgyógyászat",
  "Psihiatrie": "Pszichiátria",
  "Psihologie / Psihoterapie": "Pszichológia / Pszichoterápia",
  "Radiologie dentară": "Fogászati radiológia",
  "Radioterapie": "Sugárterápia",
  "Recuperare medicală / Kinetoterapie": "Rehabilitáció / Gyógytorna",
  "Reproducere umană asistată": "Asszisztált reprodukció",
  "Reumatologie": "Reumatológia",
  "Stomatologie": "Fogászat",
  "Stomatologie pediatrică": "Gyermekfogászat",
  "Urologie": "Urológia",
};

const CATEGORY_HU = {
  "Medicină generală": "Általános orvoslás",
  "Specialități medicale": "Belgyógyászati szakterületek",
  "Chirurgie": "Sebészet",
  "Femei și copii": "Nők és gyermekek",
  "Sănătate mintală": "Mentális egészség",
  "Stomatologie": "Fogászat",
  "Oncologie": "Onkológia",
  "Analize și recuperare": "Vizsgálatok és rehabilitáció",
};

// code -> specialty row ({ code, name_ro, name_en, category_ro, ... })
export const SPECIALTY_BY_CODE = Object.fromEntries(data.specialties.map((s) => [s.code, s]));
const SPECIALTY_BY_NAME = Object.fromEntries(data.specialties.map((s) => [s.name_ro, s]));

// Romanian specialty name -> name in the current language
export function specialtyName(nameRo) {
  const lang = getLanguage();
  if (lang === "en") return SPECIALTY_BY_NAME[nameRo]?.name_en ?? nameRo;
  if (lang === "hu") return SPECIALTY_HU[nameRo] ?? nameRo;
  return nameRo;
}

// All names of a specialty (for searching in any language)
export function specialtyAllNames(nameRo) {
  return [nameRo, SPECIALTY_BY_NAME[nameRo]?.name_en, SPECIALTY_HU[nameRo]].filter(Boolean);
}

// =============================================================
//  SPECIALTY GROUPS = specialties.category_ro in the database.
//  Here you only choose the order, icon and colour of each group.
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

const categories = [...new Set(data.specialties.map((s) => s.category_ro))].sort((a, b) => {
  const ia = GROUP_STYLES.findIndex((g) => g.category === a);
  const ib = GROUP_STYLES.findIndex((g) => g.category === b);
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
});

export const SPECIALTY_GROUPS = categories.map((category) => {
  const style = GROUP_STYLES.find((g) => g.category === category) ?? DEFAULT_GROUP_STYLE;
  const english = data.specialties.find((s) => s.category_ro === category)?.category_en;
  return withLabels({
    id: category,
    labels: { ro: category, en: english ?? category, hu: CATEGORY_HU[category] ?? category },
    icon: style.icon,
    color: style.color,
    items: data.specialties
      .filter((s) => s.category_ro === category)
      .map((s) => s.name_ro)
      .sort((a, b) => a.localeCompare(b, "ro")),
  });
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
const FALLBACK_CATEGORY = withLabels({
  id: "other",
  icon: "📍",
  color: "#6b7280",
  labels: { ro: "Altele", en: "Other", hu: "Egyéb" },
  singulars: { ro: "Unitate medicală", en: "Medical facility", hu: "Egészségügyi intézmény" },
});

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) ?? FALLBACK_CATEGORY;
}

export function getOwnership(id) {
  return OWNERSHIP.find((o) => o.id === id)?.label ?? id;
}
