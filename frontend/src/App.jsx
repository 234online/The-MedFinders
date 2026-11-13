import SearchBar from "./SearchBar.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import places from "./data/places.json";
import "./App.css";

// Centre of Timișoara (around Piața Victoriei)
const CENTER = [45.7537, 21.2257];

// Category id -> label and marker colour
const CATEGORIES = {
  all:       { label: "All",       color: "#2563eb" },
  landmark:  { label: "Landmarks", color: "#dc2626" },
  culture:   { label: "Culture",   color: "#9333ea" },
  museum:    { label: "Museums",   color: "#c026d3" },
  religion:  { label: "Religion",  color: "#b45309" },
  park:      { label: "Parks",     color: "#16a34a" },
  education: { label: "Education", color: "#0891b2" },
  shopping:  { label: "Shopping",  color: "#ea580c" },
  transport: { label: "Transport", color: "#475569" },
  sport:     { label: "Sport",     color: "#0d9488" },
};

// Lowercase and strip diacritics, so "timisoara" matches "Timișoara"
function normalize(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function matches(place, query, category) {
  if (category !== "all" && place.category !== category) return false;
  if (!query.trim()) return true;
  const haystack = normalize(
    [place.name, place.description, place.category, ...place.tags].join(" ")
  );
  // Every word in the query must appear somewhere
  return normalize(query).split(/\s+/).every((word) => haystack.includes(word));
}

export default function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [map, setMap] = useState(null);
  const markerRefs = useRef({});

  const results = useMemo(
    () => places.filter((p) => matches(p, query, category)),
    [query, category]
  );
  const resultIds = useMemo(() => new Set(results.map((p) => p.id)), [results]);

  // Zoom the map to fit whatever matches the current search
  useEffect(() => {
    if (!map || results.length === 0) return;
    const points = results.map((p) => [p.lat, p.lng]);
    if (points.length === 1) {
      map.flyTo(points[0], 16, { duration: 0.6 });
    } else {
      map.flyToBounds(points, { padding: [40, 40], maxZoom: 16, duration: 0.6 });
    }
  }, [map, results]);

  function selectPlace(place) {
    setSelectedId(place.id);
    if (!map) return;
    map.flyTo([place.lat, place.lng], 17, { duration: 0.6 });
    markerRefs.current[place.id]?.openPopup();
  }

  // Draw non-matching places first so highlighted ones sit on top
  const ordered = [...places].sort(
    (a, b) => Number(resultIds.has(a.id)) - Number(resultIds.has(b.id))
  );

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Timișoara</h1>


        <div className="chips">
          {Object.entries(CATEGORIES).map(([id, { label, color }]) => (
            <button
              key={id}
              className={"chip" + (category === id ? " active" : "")}
              style={category === id ? { background: color, borderColor: color } : {}}
              onClick={() => setCategory(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="count">
          {results.length} of {places.length} places
        </p>

        <ul className="results">
          {results.map((p) => (
            <li
              key={p.id}
              className={p.id === selectedId ? "selected" : ""}
              onClick={() => selectPlace(p)}
            >
              <span className="dot" style={{ background: CATEGORIES[p.category].color }} />
              <div>
                <strong>{p.name}</strong>
                <small>{p.description}</small>
              </div>
            </li>
          ))}
          {results.length === 0 && <li className="empty">No places match your search.</li>}
        </ul>
      </aside>

      <div className="map-wrap">
      <SearchBar value={query} onChange={setQuery} />

      <MapContainer ref={setMap} center={CENTER} zoom={14} className="map">


        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {ordered.map((p) => {
          const isMatch = resultIds.has(p.id);
          const isSelected = p.id === selectedId;
          const color = CATEGORIES[p.category].color;
          return (
            <CircleMarker
              key={p.id}
              ref={(ref) => (markerRefs.current[p.id] = ref)}
              center={[p.lat, p.lng]}
              radius={isSelected ? 13 : isMatch ? 9 : 5}
              pathOptions={{
                color: isMatch ? "#ffffff" : "#9ca3af",
                weight: isMatch ? 2 : 1,
                fillColor: isMatch ? color : "#9ca3af",
                fillOpacity: isMatch ? 0.95 : 0.4,
              }}
              eventHandlers={{ click: () => setSelectedId(p.id) }}
            >
              <Popup>
                <strong>{p.name}</strong>
                <br />
                {p.description}
                <br />
                <em>{p.tags.join(", ")}</em>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>

    </div>
  );
}
