import data from "./clinics.json";
import {
  getCategory,
  SPECIALTY_BY_CODE,
  KIDS_SPECIALTIES,
} from "../config/placeTypes.js";
import { isAlways24h, isOpenWeekend } from "../services/hoursLogic.js";
import { translateClinicNote, ROLES_RO } from "./translations.js";

// =============================================================
//  DATABASE -> WEBSITE
//  clinics.json is an export of the PostgreSQL database
//  (database/export_clinics_json.sql), with the database's own
//  table and column names. This file turns each clinic into the
//  "place" object the website uses. If the database gets new
//  columns, map them here.
// =============================================================

// The database writes 'not listed' instead of leaving a value empty
const listed = (value) => (!value || value === "not listed" ? null : value);

// opening_hours rows -> 7 days, Monday first (see services/hoursLogic.js)
function toWeek(rows) {
  const week = Array(7).fill(null); // null = hours not stated for that day
  for (const r of rows) {
    const note = r.notes ?? undefined;
    let day = null;
    if (r.is_24h) day = { h24: true, note };
    else if (r.is_closed) day = { closed: true, note };
    else if (r.open_time && r.close_time) day = { open: r.open_time, close: r.close_time, note };
    week[r.day_of_week - 1] = day;
  }
  return week;
}

function toPlace(c) {
  const specialties = c.specialties.map((code) => SPECIALTY_BY_CODE[code]?.name_ro ?? code);
  const hours = toWeek(c.opening_hours);
  const category = getCategory(c.kind);

  const doctors = c.doctors.map((d) => ({
    name: d.full_name,
    title: d.title,
    specialty: d.specialty ? SPECIALTY_BY_CODE[d.specialty]?.name_ro ?? d.specialty : null,
    role: d.role ? ROLES_RO[d.role] ?? d.role : null,
    schedule: d.schedule.map((s) => ({ day: s.day_of_week - 1, start: s.start_time, end: s.end_time })),
  }));

  return {
    id: c.code,
    name: c.name,
    category: c.kind,
    network: c.network,
    ownership: c.ownership,
    address: c.address,
    postalCode: listed(c.postal_code),
    phone: c.phone,
    email: listed(c.email),
    website: listed(c.website),
    cnas: c.cnas_contract, // "yes" | "no" | "unknown" (not shown at the moment)
    lat: Number(c.latitude),
    lng: Number(c.longitude),
    approximate: c.geo_precision === "street", // pin is only on the right street
    googlePlaceId: c.google_place_id ?? null, // optional column, for live Google hours

    description: translateClinicNote(c.notes, {
      kindLabel: category.singular,
      network: c.network,
      specialtyNames: specialties,
    }),
    specialties,
    // extra words for the search box: network and doctors' names
    tags: [c.network !== "Independent" ? c.network : null, ...doctors.map((d) => d.name)].filter(Boolean),

    hours,
    open24h: isAlways24h(hours),
    weekend: isOpenWeekend(hours),
    emergency: c.kind === "hospital" && /urgen/i.test(c.name),
    kids: specialties.some((s) => KIDS_SPECIALTIES.includes(s)),

    doctors,
    ratings: c.ratings.map((r) => ({
      platform: r.platform,
      score: Number(r.score),
      maxScore: Number(r.max_score),
      votes: r.votes,
      url: r.source_url,
      retrievedOn: r.retrieved_on,
    })),
    sources: c.sources.map((s) => ({ url: s.url, confirms: s.confirms })),
  };
}

export const places = data.clinics.map(toPlace);
export const exportedOn = data.exported_on;
