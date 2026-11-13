import { useEffect, useState } from "react";
import { TEXT } from "../config/texts.js";

// =============================================================
//  OPENING HOURS
//  Where the schedule in the popup comes from:
//
//  1) Google Maps (live), used when BOTH are true:
//       - the .env file has VITE_GOOGLE_MAPS_KEY=your-key
//       - the place has "googlePlaceId" filled in, in places.json
//     (see README for how to get the key and the place ids)
//
//  2) Otherwise the "hours" field in places.json (prototype data).
//
//  Whichever is used, the popup receives the same shape:
//    { source: "google" | "local",
//      days: ["08:00–20:00", ..., "Închis"]   // Monday ... Sunday
//      openNow: true | false | null }
//  or null if no schedule is known.
// =============================================================

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

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
    openNow: hours.openNow ?? null,
  };
}

// Prototype hours from places.json, e.g. "hours": { "mon": "08:00-20:00", "sun": null }
function localHours(place) {
  if (place.open24h) {
    return { source: "local", days: Array(7).fill(TEXT.nonstop), openNow: true };
  }
  if (!place.hours) return null;

  const ranges = DAY_KEYS.map((key) => place.hours[key] ?? null);
  return {
    source: "local",
    days: ranges.map((r) => (r ? r.replace("-", "–") : TEXT.closed)),
    openNow: isOpenNow(ranges),
  };
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function isOpenNow(ranges, now = new Date()) {
  const today = ranges[(now.getDay() + 6) % 7]; // JavaScript's week starts on Sunday
  if (!today) return false;
  const [open, close] = today.split("-").map(toMinutes);
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= open && minutes < close;
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
