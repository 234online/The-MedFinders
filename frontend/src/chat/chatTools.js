import { FILTERS } from "../config/filters.js";
import { SPECIALTIES, USED_KINDS, getCategory } from "../config/placeTypes.js";
import { applyFilters, getDefaults } from "../filters/filterEngine.js";
import { isOpenAt, dayIndex } from "../services/hoursLogic.js";

// =============================================================
//  The "search_clinics" tool the AI uses (and the simple mode too).
//  Runs in the browser on the same data and filters as the map,
//  so whatever the chat finds can be shown on the map exactly.
// =============================================================

const MAX_RESULTS = 8;

// Tool input (from the AI) -> the map's filter values + search text
export function toFilters(input = {}) {
  const filters = {};
  const specialties = (input.specialties ?? []).filter((s) => SPECIALTIES.includes(s));
  const types = (input.types ?? []).filter((t) => USED_KINDS.has(t));
  if (specialties.length) filters.specialties = specialties;
  if (types.length) filters.category = types;
  if (input.open_now) filters.openNow = true;
  if (input.open_24h) filters.open24h = true;
  if (input.open_weekend) filters.weekend = true;
  if (input.emergency) filters.emergency = true;
  if (input.for_children) filters.kids = true;
  return { filters, text: typeof input.text === "string" ? input.text.trim() : "" };
}

function todayHours(place) {
  const day = place.hours?.[dayIndex()];
  if (!day) return "not stated";
  if (day.closed) return "closed";
  if (day.h24) return "24h";
  return `${day.open}-${day.close}`;
}

// Runs the search. places must already have score/reviewCount.
export function searchClinics(places, input) {
  const { filters, text } = toFilters(input);
  const matches = applyFilters(places, FILTERS, { ...getDefaults(FILTERS), ...filters }, text);

  // Best rated first, unrated last; open places before closed ones
  const ranked = [...matches].sort((a, b) => {
    const openA = isOpenAt(a.hours) === true ? 1 : 0;
    const openB = isOpenAt(b.hours) === true ? 1 : 0;
    return openB - openA || (b.score ?? 0) - (a.score ?? 0) || b.reviewCount - a.reviewCount;
  });
  const top = ranked.slice(0, MAX_RESULTS);

  return {
    filters,
    text,
    total: matches.length,
    placeIds: top.map((p) => p.id),
    // What the AI sees (short, so answers stay fast and cheap)
    forModel: {
      total_matches: matches.length,
      shown: top.length,
      clinics: top.map((p) => ({
        id: p.id,
        name: p.name,
        type: getCategory(p.category).id,
        network: p.network,
        address: p.address,
        phone: p.phone,
        open_now: isOpenAt(p.hours),
        hours_today: todayHours(p),
        open_24h: p.open24h,
        emergency_hospital: p.emergency,
        score: p.score,
        ratings: p.reviewCount,
        specialties: p.specialties.slice(0, 8),
        doctors: p.doctors.slice(0, 3).map((d) => d.name),
      })),
    },
  };
}
