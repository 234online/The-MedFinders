import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import places from "./data/places.json";
import SearchBar from "./SearchBar.jsx";
import FilterPanel from "./filters/FilterPanel.jsx";
import FloatingButton from "./components/FloatingButton.jsx";
import Modal from "./components/Modal.jsx";
import PlacePopup from "./components/PlacePopup.jsx";
import LoginForm from "./components/LoginForm.jsx";
import SavedPlaces from "./components/SavedPlaces.jsx";
import Documentation from "./content/Documentation.jsx";
import { useAccount } from "./account/useAccount.js";
import { FILTERS } from "./config/filters.js";
import { getCategory } from "./config/placeTypes.js";
import { applyFilters, getDefaults } from "./filters/filterEngine.js";
import { TEXT } from "./config/texts.js";
import "./App.css";

// Centre of Timișoara (around Piața Victoriei)
const CENTER = [45.7537, 21.2257];

// Icons for the floating buttons: replace these files in the public folder
const INFO_ICON = "/info-icon.svg";
const ACCOUNT_ICON = "/user-icon.svg";

export default function App() {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState(() => getDefaults(FILTERS));
  const [selectedId, setSelectedId] = useState(null);
  const [map, setMap] = useState(null);
  const markerRefs = useRef({});

  // Which window is open: null | "docs" | "login" | "account"
  const [modal, setModal] = useState(null);
  // A place the user tried to save before logging in (saved right after login)
  const [pendingSaveId, setPendingSaveId] = useState(null);
  const account = useAccount();

  const results = useMemo(
    () => applyFilters(places, FILTERS, filterValues, query),
    [filterValues, query]
  );
  const resultIds = useMemo(() => new Set(results.map((p) => p.id)), [results]);
  const favoritePlaces = places.filter((p) => account.favorites.includes(p.id));

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

  // ---------- Account ----------
  function openAccount() {
    setModal(account.user ? "account" : "login");
  }

  function closeModal() {
    setModal(null);
    setPendingSaveId(null);
  }

  function handleToggleFavorite(place) {
    if (!account.user) {
      setPendingSaveId(place.id);
      setModal("login");
      return;
    }
    account.toggleFavorite(place.id);
  }

  // Returns an error message, or null if login worked
  function handleLogin(email, password) {
    const { error, user } = account.login(email, password);
    if (error) return error;
    if (pendingSaveId != null) account.addFavorite(pendingSaveId, user.email);
    closeModal();
    return null;
  }

  function handleLogout() {
    account.logout();
    closeModal();
  }

  function showSavedPlace(place) {
    closeModal();
    selectPlace(place);
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

        <FloatingButton
          icon={ACCOUNT_ICON}
          label={TEXT.accountButton}
          position="top-right"
          active={Boolean(account.user)}
          onClick={openAccount}
        />

        <FloatingButton
          icon={INFO_ICON}
          label={TEXT.infoButton}
          position="bottom-right"
          onClick={() => setModal("docs")}
        />

        <MapContainer ref={setMap} center={CENTER} zoom={14} className="map">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {ordered.map((p) => {
            const isMatch = resultIds.has(p.id);
            const isSelected = p.id === selectedId;
            const category = getCategory(p.category);
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
                <Popup minWidth={260} maxWidth={300}>
                  <PlacePopup
                    place={p}
                    isFavorite={account.isFavorite(p.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* ---------- Windows ---------- */}
      {modal === "docs" && (
        <Modal title={TEXT.docsTitle} onClose={closeModal} width={640}>
          <Documentation />
        </Modal>
      )}

      {modal === "login" && (
        <Modal title={TEXT.loginTitle} onClose={closeModal} width={400}>
          <LoginForm
            notice={pendingSaveId != null ? TEXT.loginToSave : null}
            onSubmit={handleLogin}
          />
        </Modal>
      )}

      {modal === "account" && account.user && (
        <Modal title={TEXT.accountTitle} onClose={closeModal} width={460}>
          <SavedPlaces
            user={account.user}
            places={favoritePlaces}
            onSelect={showSavedPlace}
            onRemove={(p) => account.removeFavorite(p.id)}
            onLogout={handleLogout}
          />
        </Modal>
      )}
    </div>
  );
}
