import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import places from "./data/places.json";
import SearchBar from "./SearchBar.jsx";
import FilterPanel from "./filters/filterPanel.jsx";
import { FILTERS } from "./config/filters.js";
import { FEATURES, getCategory } from "./config/placeTypes.js";
import { applyFilters, getDefaults } from "./filters/filterEngine.js";
import { TEXT } from "./config/texts.js";
import "./App.css";

// Centre of Timișoara (around Piața Victoriei)
const CENTER = [45.7537, 21.2257];

export default function App() {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState(() => getDefaults(FILTERS));
  const [selectedId, setSelectedId] = useState(null);
  const [map, setMap] = useState(null);
  const markerRefs = useRef({});

  const results = useMemo(
    () => applyFilters(places, FILTERS, filterValues, query),
    [filterValues, query]
  );
  const resultIds = useMemo(() => new Set(results.map((p) => p.id)), [results]);

  function setFilter(id, value) {
    setFilterValues((prev) => ({ ...prev, [id]: value }));
  }

  function resetFilters() {
    setFilterValues(getDefaults(FILTERS));
  }

  // Zoom the map to fit whatever matches the current search and filters
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
        <h1>{TEXT.appTitle}</h1>

        <FilterPanel
          filters={FILTERS}
          values={filterValues}
          onChange={setFilter}
          onReset={resetFilters}
        />

        <p className="count">{TEXT.resultsCount(results.length, places.length)}</p>

        <ul className="results">
          {results.map((p) => {
            const category = getCategory(p.category);
            return (
              <li
                key={p.id}
                className={p.id === selectedId ? "selected" : ""}
                onClick={() => selectPlace(p)}
              >
                <span className="dot" style={{ background: category.color }} />
                <div>
                  <strong>{p.name}</strong>
                  <small>
                    {category.label}
                    {p.area && ` · ${p.area}`}
                  </small>
                </div>
              </li>
            );
          })}
          {results.length === 0 && <li className="empty">{TEXT.noResults}</li>}
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
            const category = getCategory(p.category);
            const badges = FEATURES.filter((f) => p[f.id] === true);
            return (
              <CircleMarker
                key={p.id}
                ref={(ref) => (markerRefs.current[p.id] = ref)}
                center={[p.lat, p.lng]}
                radius={isSelected ? 13 : isMatch ? 9 : 5}
                pathOptions={{
                  color: isMatch ? "#ffffff" : "#9ca3af",
                  weight: isMatch ? 2 : 1,
                  fillColor: isMatch ? category.color : "#9ca3af",
                  fillOpacity: isMatch ? 0.95 : 0.4,
                }}
                eventHandlers={{ click: () => setSelectedId(p.id) }}
              >
                <Popup>
                  <div className="popup">
                    <strong>{p.name}</strong>
                    <span className="popup-type" style={{ color: category.color }}>
                      {category.label}
                    </span>
                    {p.address && <span>{p.address}</span>}
                    {p.phone && <a href={`tel:${p.phone.replace(/\s/g, "")}`}>{p.phone}</a>}
                    {p.description && <span>{p.description}</span>}
                    {badges.length > 0 && (
                      <div className="badges">
                        {badges.map((f) => (
                          <span key={f.id} className="badge">{f.label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
