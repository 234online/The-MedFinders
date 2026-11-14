import L from "leaflet";
import { categoryIconHtml } from "../components/MedIcon.jsx";

// =============================================================
//  MAP PINS: round coloured pins with the category's line icon.
//    "match"    -> place matches the search/filters
//    "selected" -> the place you clicked (bigger)
//    "dim"      -> doesn't match: small grey dot
//  Pin styles are in App.css (.pin ...)
// =============================================================

const SIZES = { selected: 46, match: 34, dim: 12 };
const cache = new Map();

export function markerIcon(category, state) {
  const key = `${category.id}:${state}`;
  if (cache.has(key)) return cache.get(key);

  const size = SIZES[state];
  const html =
    state === "dim"
      ? `<div class="pin pin-dim"></div>`
      : `<div class="pin pin-${state}" style="--pin-color:${category.color}">${categoryIconHtml(category.id, state === "selected" ? 24 : 18)}</div>`;

  const icon = L.divIcon({
    html,
    className: "pin-wrap", // replaces Leaflet's default white box
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
  cache.set(key, icon);
  return icon;
}
