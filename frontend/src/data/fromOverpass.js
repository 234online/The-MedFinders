// Converts an OpenStreetMap export (overpass-turbo.eu → Export → raw data)
// into the format the app uses. See README for the query to run.
//
// Usage in App.jsx (replace the places.json import):
//   import osm from "./data/export.json";
//   import { fromOverpass } from "./data/fromOverpass.js";
//   const places = fromOverpass(osm);

// OpenStreetMap tags -> our category ids (first match wins)
const CATEGORY_RULES = [
  [(t) => t.amenity === "hospital", "hospital"],
  [(t) => t.amenity === "pharmacy" || t.healthcare === "pharmacy", "pharmacy"],
  [(t) => t.amenity === "dentist" || t.healthcare === "dentist", "dentist"],
  [(t) => t.healthcare === "laboratory", "laboratory"],
  [(t) => t.amenity === "clinic" || t.healthcare === "clinic", "clinic"],
  [(t) => t.amenity === "doctors" || t.healthcare === "doctor", "doctor"],
  [(t) => t.shop === "optician", "optician"],
];

export function fromOverpass(json) {
  return json.elements
    .filter((e) => e.tags?.name)
    .map((e) => {
      const t = e.tags;
      const rule = CATEGORY_RULES.find(([matches]) => matches(t));
      const street = t["addr:street"];
      return {
        id: `${e.type}/${e.id}`,
        name: t.name,
        category: rule ? rule[1] : "other",
        area: "", // OpenStreetMap doesn't say which neighbourhood
        address: street ? `${street} ${t["addr:housenumber"] ?? ""}`.trim() : "",
        phone: t.phone ?? t["contact:phone"] ?? "",
        tags: [t["healthcare:speciality"], t.operator].filter(Boolean),
        open24h: t.opening_hours === "24/7",
        emergency: t.emergency === "yes",
        wheelchair: t.wheelchair === "yes",
        cnas: false, // not recorded in OpenStreetMap; fill in yourself
        lat: e.lat ?? e.center?.lat,
        lng: e.lon ?? e.center?.lon,
        description: t.opening_hours ? `Program: ${t.opening_hours}` : "",
      };
    })
    .filter((p) => p.lat != null && p.lng != null);
}
