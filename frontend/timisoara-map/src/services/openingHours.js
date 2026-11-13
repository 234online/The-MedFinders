import { useEffect, useState } from "react";
import { TEXT } from "../config/texts.js";
import { isOpenAt } from "./hoursLogic.js";
import { translateHourNote } from "../data/translations.js";

// =============================================================
//  OPENING HOURS
//  Where the schedule in the popup comes from:
//
//  1) Google Maps (live), used when BOTH are true:
//       - the .env file has VITE_GOOGLE_MAPS_KEY=your-key
//       - the place has a Google Place ID (add a google_place_id column
//         to the clinics table; loadPlaces.js already reads it)
//     (see README for how to get the key and the place ids)
//
//  2) Otherwise the opening hours from the database (place.hours).
//
//  Whichever is used, the popup receives the same shape:
//    { source: "google" | "database",
//      days:  ["08:00–20:00", ..., "Închis"]   // Monday ... Sunday
//      notes: ["", "Pauză 13:30–17:30", ...]   // small text under a day
//      openNow: true | false | null }
//  or null if no schedule is known.
// =============================================================

export async function getOpeningHours(place) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (apiKey && place.googlePlaceId) {
    try {
      return await fetchFromGoogle(place.googlePlaceId, apiKey);
    } catch (error) {
      console.warn("Couldn't get hours from Google, using local data instead.", error);
    }
  }
  return localHours(place);
}

// Google Places API (New): Place Details with only the opening hours field.
// Note: the key is visible in the browser. Restrict it in Google Cloud
// (to your website's address and to the Places API), or move this call
// to your backend. Google's terms don't allow storing these hours
// permanently, so they are fetched each time.
async function fetchFromGoogle(placeId, apiKey) {
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=ro`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "regularOpeningHours",
      },
    }
  );
  if (!response.ok) throw new Error(`Google Places error ${response.status}`);

  const data = await response.json();
  const hours = data.regularOpeningHours;
  if (!hours?.weekdayDescriptions) throw new Error("Google has no hours for this place");

  return {
    source: "google",
    // "luni: 08:00–20:00" -> "08:00–20:00"
    days: hours.weekdayDescriptions.map((line) => line.replace(/^[^:]+:\s*/, "")),
    notes: [],
    openNow: hours.openNow ?? null,
  };
}

// Hours from the database (place.hours, see services/hoursLogic.js)
function localHours(place) {
  const week = place.hours;
  if (!week || week.every((d) => d === null)) return null;

  return {
    source: "database",
    days: week.map((d) => {
      if (d === null) return TEXT.notStated;
      if (d.closed) return TEXT.closed;
      if (d.h24) return TEXT.nonstop;
      const overnight = d.close < d.open;
      return `${d.open}–${d.close}${overnight ? ` ${TEXT.nextDay}` : ""}`;
    }),
    notes: week.map((d) => translateHourNote(d?.note)),
    openNow: isOpenAt(week),
  };
}

// React hook used by the popup: { loading, hours }
export function useOpeningHours(place) {
  const [state, setState] = useState({ loading: true, hours: null });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, hours: null });
    getOpeningHours(place).then((hours) => {
      if (!cancelled) setState({ loading: false, hours });
    });
    return () => {
      cancelled = true;
    };
  }, [place]);

  return state;
}
