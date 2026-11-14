import { getLanguage } from "../config/texts.js";
import { getCategory, specialtyName } from "../config/placeTypes.js";

// =============================================================
//  THE DATABASE'S NOTES IN THREE LANGUAGES
//  The database stores notes in English, so English shows them as
//  they are. Romanian and Hungarian use the tables below. A note
//  that isn't listed is shown in English (Hungarian falls back to
//  Romanian first), so nothing breaks when the database changes:
//  just add the new note here when you want it translated.
// =============================================================

// Clinic notes (clinics.notes), exact text -> Romanian
export const CLINIC_NOTES_RO = {
  "After 20:00 and at weekends only emergencies are taken.":
    "După ora 20:00 și în weekend se preiau doar urgențe.",
  "Appointments by phone only, Mon–Fri 09:30–13:30.":
    "Programări doar telefonic, luni–vineri 09:30–13:30.",
  "Appointments by phone only.": "Programări doar telefonic.",
  "Blood collection Mon–Fri 07:30–17:00, Sat 08:00–12:30.":
    "Recoltare analize luni–vineri 07:30–17:00, sâmbătă 08:00–12:30.",
  "Cardiovascular clinic.": "Clinică de boli cardiovasculare.",
  "Dental X-ray / CBCT centre; the company also lists locations on Calea Aradului 18 and Bd. Liviu Rebreanu 2/A.":
    "Centru de radiologie dentară / CBCT; compania mai are locații pe Calea Aradului 18 și Bd. Liviu Rebreanu 2/A.",
  "Dental emergencies non-stop: 0749 225 555.": "Urgențe stomatologice non-stop: 0749 225 555.",
  "Dialysis centre.": "Centru de dializă.",
  "Equipped for virtual-reality (VR) assisted blood collection for children.":
    "Dotat pentru recoltare de sânge asistată de realitate virtuală (VR) pentru copii.",
  "European ophthalmology network; cataract, glaucoma, retina, refractive surgery.":
    "Rețea europeană de oftalmologie: cataractă, glaucom, retină, chirurgie refractivă.",
  "Expanded in 2026 to ~1000 m2, 100+ doctors, 30+ specialties. Blood collection Mon–Fri 07:30–15:30, Sat 08:00–12:00.":
    "Extinsă în 2026 la ~1000 m², peste 100 de medici și 30 de specialități. Recoltare analize luni–vineri 07:30–15:30, sâmbătă 08:00–12:00.",
  "Family medicine and pediatrics practice working with the health insurance house.":
    "Cabinet de medicina familiei și pediatrie, în contract cu casa de asigurări.",
  "Family medicine centre of excellence; the hours stored are those of the out-of-hours centre (permanență).":
    "Centru de excelență în medicina familiei; programul afișat este cel al centrului de permanență.",
  "First dental centres for children and teenagers in western Romania (opened Dec 2013).":
    "Primele centre stomatologice pentru copii și adolescenți din vestul României (deschise în dec. 2013).",
  "Free services for Allianz Țiriac, Signal Iduna and SanoPass insured patients.":
    "Servicii gratuite pentru asigurații Allianz Țiriac, Signal Iduna și SanoPass.",
  "Has a contract with CAS Timiș.": "Are contract cu CAS Timiș.",
  "Has an imaging centre with 1.5T MRI and X-ray.": "Are centru de imagistică cu RMN 1,5T și radiologie.",
  "Integrated outpatient, imaging and laboratory services under one roof.":
    "Ambulatoriu, imagistică și laborator sub același acoperiș.",
  "MRI / CT imaging diagnostic centre.": "Centru de diagnostic imagistic RMN / CT.",
  "Medical recovery and physiotherapy clinic.": "Clinică de recuperare medicală și kinetoterapie.",
  "Medici's location for mother-and-child care.": "Locația Medici's dedicată mamei și copilului.",
  "Multidisciplinary clinic focused on newborns and children; CNAS contract.":
    "Clinică multidisciplinară axată pe nou-născuți și copii; contract CNAS.",
  "Next to the Louis Țurcanu children's hospital; weekend consultations by appointment.":
    "Lângă Spitalul de Copii „Louis Țurcanu”; consultații în weekend cu programare.",
  "Occupational medicine centre; blood collection Mon–Fri 08:00–16:00.":
    "Centru de medicina muncii; recoltare analize luni–vineri 08:00–16:00.",
  "Operated by Oftalmologica SRL (founded 1992).": "Operată de Oftalmologica SRL (fondată în 1992).",
  "Outpatient appointments: 0752 297 252 / 0748 331 296. Hours stored = outpatient appointment line.":
    "Programări ambulatoriu: 0752 297 252 / 0748 331 296. Programul afișat este cel al liniei de programări.",
  "Over 1000 m2, 11 consultation rooms; accepts CAS, private and insured patients.":
    "Peste 1000 m², 11 cabinete de consultații; primește pacienți CAS, privați și asigurați.",
  "Over 20 specialties.": "Peste 20 de specialități.",
  "Over 20 specialties; also accepts OMNIASIG and Allianz-Țiriac private insurance.":
    "Peste 20 de specialități; acceptă și asigurări private OMNIASIG și Allianz-Țiriac.",
  "Private hospital with outpatient clinic; a non-stop unit also operates at this address.":
    "Spital privat cu ambulatoriu; la aceeași adresă funcționează și o unitate non-stop.",
  "Psychiatry, psychotherapy and psychology clinic.": "Clinică de psihiatrie, psihoterapie și psihologie.",
  "Public cardiovascular institute. Hours stored = integrated outpatient consultations.":
    "Institut public de boli cardiovasculare. Programul afișat este cel al ambulatoriului integrat.",
  "Run by the OncoHelp Association; ESMO-designated centre for integrated oncology and palliative care. Hours stored = appointment desk.":
    "Administrat de Asociația OncoHelp; centru desemnat ESMO pentru oncologie integrată și îngrijiri paliative. Programul afișat este cel al biroului de programări.",
  "Second Neuromed imaging location.": "A doua locație de imagistică Neuromed.",
  "Specialised in varicose-vein treatment.": "Specializată în tratamentul varicelor.",
  "The only pediatric hospital in western Romania; new integrated outpatient building opened May 2026. Hours stored = emergency department (non-stop).":
    "Singurul spital de pediatrie din vestul României; noul ambulatoriu integrat a fost deschis în mai 2026. Programul afișat este cel al UPU (non-stop).",
  "Works with the Timiș county health insurance house; has a blood-collection point.":
    "În contract cu Casa de Asigurări de Sănătate Timiș; are punct de recoltare.",
  "~1018 beds across several locations. Hours stored = emergency department (UPU), non-stop.":
    "~1018 paturi în mai multe locații. Programul afișat este cel al UPU, non-stop.",
};

// Opening-hours notes (opening_hours.notes)
const HOUR_NOTES = {
  "Appointment desk hours": { ro: "Program birou programări", hu: "Előjegyzési iroda nyitvatartása" },
  "By appointment": { ro: "Cu programare", hu: "Előjegyzéssel" },
  "Emergency department (UPU), non-stop": { ro: "UPU, non-stop", hu: "Sürgősségi osztály, éjjel-nappal" },
  "Emergency department, non-stop": { ro: "Urgențe, non-stop", hu: "Sürgősségi osztály, éjjel-nappal" },
  "Integrated outpatient consultations": { ro: "Consultații ambulatoriu integrat", hu: "Integrált járóbeteg-rendelés" },
  "Out-of-hours centre, non-stop": { ro: "Centru de permanență, non-stop", hu: "Ügyeleti központ, éjjel-nappal" },
  "Out-of-hours centre, runs overnight until 08:00": {
    ro: "Centru de permanență, până a doua zi la 08:00",
    hu: "Ügyeleti központ, másnap reggel 8-ig",
  },
  "Outpatient appointment line hours": {
    ro: "Program linie programări ambulatoriu",
    hu: "Járóbeteg-előjegyzési vonal nyitvatartása",
  },
};

// Doctor roles (doctor_assignments.role)
const ROLES = {
  "Head of 2nd Pediatrics Clinic": { ro: "Șef Clinica Pediatrie II", hu: "A II. sz. Gyermekklinika vezetője" },
  "Head of Endocrinology Clinic": { ro: "Șef Clinica de Endocrinologie", hu: "Az Endokrinológiai Klinika vezetője" },
  "Head of palliative care": { ro: "Șef îngrijiri paliative", hu: "A palliatív ellátás vezetője" },
  Manager: { ro: "Manager", hu: "Igazgató" },
  "Practice owner": { ro: "Titularul cabinetului", hu: "A rendelő tulajdonosa" },
  President: { ro: "Președinte", hu: "Elnök" },
};

export function translateRole(role) {
  if (!role) return "";
  const lang = getLanguage();
  if (lang === "en") return role;
  return ROLES[role]?.[lang] ?? ROLES[role]?.ro ?? role;
}

// "Break 13:30-17:30" -> "Pauză 13:30–17:30"
const BREAK_WORD = { ro: "Pauză", en: "Break", hu: "Szünet" };

export function translateHourNote(note) {
  if (!note) return "";
  const lang = getLanguage();
  const brk = note.match(/^Break (\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
  if (brk) return `${BREAK_WORD[lang]} ${brk[1]}–${brk[2]}`;
  if (lang === "en") return note;
  return HOUR_NOTES[note]?.[lang] ?? HOUR_NOTES[note]?.ro ?? note;
}

// Words for the template notes ("Clinic offering X, Y...")
const TEMPLATE = {
  ro: {
    lab: (network) => `Punct de recoltare și laborator de analize al rețelei ${network}.`,
    and: (n) => `și încă ${n}`,
  },
  hu: {
    lab: (network) => `A(z) ${network} hálózat vérvételi pontja és orvosi laboratóriuma.`,
    and: (n) => `és még ${n}`,
  },
};

// The clinic's description (database note) in the current language.
// Template notes are rebuilt from the clinic's specialty names.
export function placeDescription(place) {
  const note = place.notes;
  if (!note) return "";
  const lang = getLanguage();
  if (lang === "en") return note;

  const t = TEMPLATE[lang] ?? TEMPLATE.ro;
  const names = place.specialties.map(specialtyName);
  const list = (n) => {
    const more = names.length - n;
    return more > 0 ? `${names.slice(0, n).join(", ")} ${t.and(more)}` : names.join(", ");
  };
  const kind = getCategory(place.category).singular;

  if (note.startsWith("Blood collection point and medical laboratory of the")) return t.lab(place.network);
  if (/^(Individual practice|Dental clinic|Polyclinic|Clinic) offering/.test(note)) return `${kind}: ${list(4)}.`;

  // Other notes: Romanian table (Hungarian also uses it until translated)
  return CLINIC_NOTES_RO[note] ?? note;
}
