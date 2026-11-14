import { FILTERS } from "../config/filters.js";
import { SPECIALTIES, USED_KINDS, getCategory } from "../config/placeTypes.js";
import { applyFilters, getDefaults } from "../filters/filterEngine.js";
import { isOpenAt, dayIndex } from "../services/hoursLogic.js";

// =============================================================
//  The AI's tools: "search_clinics" (also used by the simple mode)
//  and "get_clinic_details".
//  Runs in the browser on the same data and filters as the map,
//  so whatever the chat finds can be shown on the map exactly.
// =============================================================

const MAX_RESULTS = 8;

// "Saturday 13:10": the AI gets the time with every tool result
// (it isn't in its instructions, see server/chatProxy.js)
function currentTime() {
  return new Date().toLocaleString("en-GB", {
    timeZone: "Europe/Bucharest",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
      current_time: currentTime(),
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
        open_24h_every_day: p.open24h, // true only if it's open all day, every day
        emergency_hospital: p.emergency,
        score: p.score,
        ratings: p.reviewCount,
        specialties: p.specialties.slice(0, 8),
        doctors: p.doctors.slice(0, 3).map((d) => d.name),
      })),
    },
  };
}

// ---------- get_clinic_details ----------
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function dayText(day) {
  if (day === null || day === undefined) return "not stated";
  if (day.closed) return "closed";
  const hours = day.h24 ? "open 24h" : `${day.open}-${day.close}${day.close < day.open ? " (until next day)" : ""}`;
  return day.note ? `${hours} (${day.note})` : hours;
}

// Full details for up to 3 places, for the AI
export function getClinicDetails(places, input = {}) {
  const ids = (Array.isArray(input.ids) ? input.ids : [input.id]).filter(Boolean).slice(0, 3);
  const found = ids.map((id) => places.find((p) => p.id === id)).filter(Boolean);

  return {
    placeIds: found.map((p) => p.id),
    forModel: {
      current_time: currentTime(),
      not_found: ids.filter((id) => !places.some((p) => p.id === id)),
      clinics: found.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.category,
        network: p.network,
        ownership: p.ownership,
        address: p.postalCode ? `${p.address}, ${p.postalCode}` : p.address,
        location_is_approximate: p.approximate,
        phone: p.phone,
        email: p.email,
        website: p.website,
        description: p.notes,
        open_now: isOpenAt(p.hours),
        opening_hours: Object.fromEntries(DAY_NAMES.map((d, i) => [d, dayText(p.hours?.[i])])),
        open_24h_every_day: p.open24h, // true only if it's open all day, every day
        emergency_hospital: p.emergency,
        for_children: p.kids,
        specialties: p.specialties,
        doctors: p.doctors.map((d) => ({
          name: d.name,
          title: d.title,
          specialty: d.specialty,
          role: d.role,
          schedule: d.schedule.map((x) => `${DAY_NAMES[x.day]} ${x.start}-${x.end}`),
        })),
        score: p.score,
        ratings: p.ratings.map((r) => ({ platform: r.platform, score: r.score, out_of: r.maxScore, votes: r.votes })),
        site_reviews_count: Math.max(0, p.reviewCount - p.ratings.reduce((n, r) => n + (r.votes ?? 1), 0)),
      })),
    },
  };
}
