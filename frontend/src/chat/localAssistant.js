import { SYMPTOMS } from "../config/symptoms.js";
import { SPECIALTIES, specialtyAllNames, specialtyName } from "../config/placeTypes.js";
import { normalize } from "../filters/filterEngine.js";
import { TEXT } from "../config/texts.js";
import { searchClinics } from "./chatTools.js";

// =============================================================
//  SIMPLE MODE (no AI): used when there is no API key or the AI
//  doesn't answer. Understands symptoms, specialty names and a few
//  words like "acum", "non-stop", "weekend", "copil", "urgență",
//  in Romanian, English and Hungarian.
// =============================================================

const WORDS = {
  openNow: ["acum", "deschis", "azi", "astazi", "now", "open", "today", "most", "nyitva"],
  open24h: ["non-stop", "nonstop", "24/7", "24 de ore", "noaptea", "night", "ejjel"],
  weekend: ["weekend", "sambata", "duminica", "saturday", "sunday", "hetvege", "szombat", "vasarnap"],
  kids: ["copil", "copii", "bebelus", "child", "kid", "baby", "gyerek", "gyermek", "baba"],
  emergency: ["urgenta", "urgent", "upu", "emergency", "surgos"],
  hospital: ["spital", "hospital", "korhaz"],
};

const has = (text, list) => list.some((w) => text.includes(normalize(w)));

// Returns { text, search?, emergency? }
export function localAnswer(message, places) {
  const text = ` ${normalize(message)} `;

  // 1) Red flags first
  const emergency = SYMPTOMS.find(
    (s) => s.level === "emergency" && (s.alarm ?? []).some((k) => text.includes(normalize(k)))
  );
  if (emergency) {
    return {
      text: TEXT.localEmergency,
      emergency: true,
      search: searchClinics(places, { emergency: true }),
    };
  }

  // 2) Symptoms and specialty names mentioned
  const specialties = new Set();
  for (const s of SYMPTOMS) {
    if (s.level === "emergency") continue; // handled above with stricter phrases
    if (s.keywords.some((k) => normalize(k).length > 3 && text.includes(normalize(k)))) {
      s.specialties.forEach((x) => specialties.add(x));
    }
  }
  for (const name of SPECIALTIES) {
    if (specialtyAllNames(name).some((n) => text.includes(normalize(n)))) specialties.add(name);
  }

  const input = {
    specialties: [...specialties],
    open_now: has(text, WORDS.openNow),
    open_24h: has(text, WORDS.open24h),
    open_weekend: has(text, WORDS.weekend),
    for_children: has(text, WORDS.kids),
    emergency: has(text, WORDS.emergency),
    types: has(text, WORDS.hospital) ? ["hospital"] : [],
  };
  const understood =
    input.specialties.length || input.open_24h || input.open_weekend || input.for_children || input.emergency || input.types.length;

  // 3) Nothing recognised: try the words as a plain search (clinic, network, doctor)
  let search = understood ? searchClinics(places, input) : searchClinics(places, { text: message });
  if (understood && search.total === 0 && input.open_now) {
    search = searchClinics(places, { ...input, open_now: false }); // relax "open now"
  }

  if (search.total === 0) return { text: understood ? TEXT.localNone : TEXT.localHelp };

  const names = input.specialties.slice(0, 3).map(specialtyName);
  return { text: TEXT.localFound(search.total, names), search };
}
