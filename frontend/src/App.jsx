import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import places from "./data/places.json";
import SearchBar from "./SearchBar.jsx";
import FilterPanel from "./filters/FilterPanel.jsx";
import Landing from "./components/Landing.jsx";
import FloatingButton from "./components/FloatingButton.jsx";
import Modal from "./components/Modal.jsx";
import PlacePopup from "./components/PlacePopup.jsx";
import PlaceDetails from "./components/PlaceDetails.jsx";
import LoginForm from "./components/LoginForm.jsx";
import SavedPlaces from "./components/SavedPlaces.jsx";
import { ScoreBadge } from "./components/Stars.jsx";
import Documentation from "./content/Documentation.jsx";
import { useAccount } from "./account/useAccount.js";
import { useReviews } from "./reviews/useReviews.js";
import { getReviews, getScore } from "./reviews/score.js";
import { FILTERS } from "./config/filters.js";
import { SORT_OPTIONS, sortPlaces } from "./config/sorting.js";
import { getCategory, SPECIALTY_GROUPS } from "./config/placeTypes.js";
import { applyFilters, getDefaults } from "./filters/filterEngine.js";
import { markerIcon } from "./map/markerIcons.js";
import { TEXT } from "./config/texts.js";
import "./App.css";

// Centre of Timișoara (around Piața Victoriei)
const CENTER = [45.7537, 21.2257];

// Icons for the floating buttons: replace these files in the public folder
const INFO_ICON = "/info-icon.svg";
const ACCOUNT_ICON = "/user-icon.svg";

export default function App() {
  const [placesList, setPlacesList] = useState(places);
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState(() => getDefaults(FILTERS));
  const [sortId, setSortId] = useState("relevance");
  const [selectedId, setSelectedId] = useState(null);
  const [map, setMap] = useState(null);
  const markerRefs = useRef({});

  // Open window: null | { type: "docs" | "login" | "account" | "details", placeId?, writing? }
  const [modal, setModal] = useState(null);
  // What to do right after logging in: null | { type: "save" | "review", placeId }
  const [pendingAction, setPendingAction] = useState(null);

  const account = useAccount();
  const reviews = useReviews();

  // Add "score" and "reviewCount" to every place (demo reviews + user reviews)
  const allPlaces = useMemo(
    () => places.map((p) => ({ ...p, ...getScore(p, reviews.byPlace[p.id]) })),
    [reviews.byPlace]
  );

  // Conectare la backend API pentru încărcarea clinicilor din baza de date
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/places";
    fetch(backendUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlacesList(data);
        }
      })
      .catch((err) => {
        console.warn("Backend API indisponibil, se folosește copia locală din places.json:", err.message);
      });
  }, []);

  const results = useMemo(
    () => applyFilters(placesList, FILTERS, filterValues, query),
    [placesList, filterValues, query]
  );
  const resultIds = useMemo(() => new Set(results.map((p) => p.id)), [results]);
  const favoritePlaces = placesList.filter((p) => account.favorites.includes(p.id));

  function setFilter(id, value) {
    setFilterValues((prev) => ({ ...prev, [id]: value }));
  }

  function resetFilters() {
    setFilterValues(getDefaults(FILTERS));
  }

  // ---------- Start page -> map ----------
  function startWith({ text = "", filters = {} } = {}) {
    setQuery(text);
    setFilterValues({ ...getDefaults(FILTERS), ...filters });
    setSelectedId(null);
    setStarted(true);
  }

  function goHome() {
    setStarted(false);
    setMap(null);
  }

  // Zoom the map to fit whatever matches the current search and filters
  useEffect(() => {
    if (!map || results.length === 0) return;
    const points = results.map((p) => [p.lat, p.lng]);
    if (points.length === 1) {
      map.flyTo(points[0], 16, { duration: 0.6 });
    } else {
      map.flyToBounds(points, { padding: [50, 50], maxZoom: 16, duration: 0.6 });
    }
    // Only re-fit when the matching set changes, not when it is just re-sorted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, [...resultIds].sort().join(",")]);

  // Fly to a place and open its popup (waits until the map exists)
  const [focusId, setFocusId] = useState(null);
  useEffect(() => {
    if (!map || focusId == null) return;
    const place = allPlaces.find((p) => p.id === focusId);
    setFocusId(null);
    if (!place) return;
    map.flyTo([place.lat, place.lng], 17, { duration: 0.6 });
    setTimeout(() => markerRefs.current[place.id]?.openPopup(), 650);
  }, [map, focusId, allPlaces]);

  function selectPlace(place) {
    setSelectedId(place.id);
    setFocusId(place.id);
  }

  // ---------- Account, favourites, reviews ----------
  function closeModal() {
    setModal(null);
    setPendingAction(null);
  }

  function askToLogin(action) {
    setPendingAction(action);
    setModal({ type: "login" });
  }

  function openAccount() {
    setModal({ type: account.user ? "account" : "login" });
  }

  function handleToggleFavorite(place) {
    if (!account.user) return askToLogin({ type: "save", placeId: place.id });
    account.toggleFavorite(place.id);
  }

  function openDetails(place) {
    setModal({ type: "details", placeId: place.id });
  }

  function handleSubmitReview(place, review) {
    reviews.addReview(place.id, review, account.user);
  }

  // Returns an error message, or null if login worked
  function handleLogin(email, password) {
    const { error, user } = account.login(email, password);
    if (error) return error;

    const action = pendingAction;
    setPendingAction(null);
    if (action?.type === "save") {
      account.addFavorite(action.placeId, user.email);
      setModal(null);
    } else if (action?.type === "review") {
      setModal({ type: "details", placeId: action.placeId, writing: true });
    } else {
      setModal(null);
    }
    return null;
  }

  function handleLogout() {
    account.logout();
    closeModal();
  }

  function showSavedPlace(place) {
    closeModal();
    if (!started) startWith();
    selectPlace(place);
  }

  // ---------- Floating buttons (on the start page and on the map) ----------
  const floatingButtons = (
    <>
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
        onClick={() => setModal({ type: "docs" })}
      />
    </>
  );

  // Draw non-matching places first so highlighted ones sit on top
  const ordered = [...placesList].sort(
    (a, b) => Number(resultIds.has(a.id)) - Number(resultIds.has(b.id))
  );
  const detailsPlace = modal?.type === "details" && allPlaces.find((p) => p.id === modal.placeId);
  const loginNotice =
    pendingAction?.type === "save"
      ? TEXT.loginToSave
      : pendingAction?.type === "review"
        ? TEXT.loginToReview
        : null;

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

        <p className="count">{TEXT.resultsCount(results.length, placesList.length)}</p>

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

            <div className="results-bar">
              <p className="count">{TEXT.resultsCount(results.length, places.length)}</p>
              <select
                className="sort-select"
                value={sortId}
                onChange={(e) => setSortId(e.target.value)}
                aria-label={TEXT.sortLabel}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <ul className="results">
              {results.map((p) => {
                const category = getCategory(p.category);
                return (
                  <li
                    key={p.id}
                    className={p.id === selectedId ? "selected" : ""}
                    onClick={() => selectPlace(p)}
                  >
                    <span className="result-icon" style={{ background: category.color }}>
                      {category.icon}
                    </span>
                    <div className="result-text">
                      <strong>{p.name}</strong>
                      <small>
                        {category.label}
                        {p.area && ` · ${p.area}`}
                      </small>
                    </div>
                    <ScoreBadge score={p.score} />
                  </li>
                );
              })}
              {results.length === 0 && <li className="empty">{TEXT.noResults}</li>}
            </ul>
          </aside>

          <div className="map-wrap">
            <SearchBar value={query} onChange={setQuery} />
            {floatingButtons}

            <MapContainer ref={setMap} center={CENTER} zoom={14} className="map">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {ordered.map((p) => {
                const isMatch = resultIds.has(p.id);
                const state = p.id === selectedId ? "selected" : isMatch ? "match" : "dim";
                return (
                  <Marker
                    key={p.id}
                    ref={(ref) => (markerRefs.current[p.id] = ref)}
                    position={[p.lat, p.lng]}
                    icon={markerIcon(getCategory(p.category), state)}
                    zIndexOffset={state === "selected" ? 1000 : isMatch ? 500 : 0}
                    eventHandlers={{ click: () => setSelectedId(p.id) }}
                  >
                    <Popup minWidth={260} maxWidth={300}>
                      <PlacePopup
                        place={p}
                        isFavorite={account.isFavorite(p.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenDetails={openDetails}
                      />
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      )}

      {/* ---------- Windows ---------- */}
      {modal?.type === "docs" && (
        <Modal title={TEXT.docsTitle} onClose={closeModal} width={640}>
          <Documentation />
        </Modal>
      )}

      {modal?.type === "login" && (
        <Modal title={TEXT.loginTitle} onClose={closeModal} width={400}>
          <LoginForm notice={loginNotice} onSubmit={handleLogin} />
        </Modal>
      )}

      {modal?.type === "account" && account.user && (
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

      {detailsPlace && (
        <Modal title={TEXT.reviewsButton} onClose={closeModal} width={680}>
          <PlaceDetails
            key={detailsPlace.id + String(modal.writing)}
            place={detailsPlace}
            reviews={getReviews(detailsPlace, reviews.byPlace[detailsPlace.id])}
            user={account.user}
            isFavorite={account.isFavorite(detailsPlace.id)}
            onToggleFavorite={handleToggleFavorite}
            onLoginToReview={(place) => askToLogin({ type: "review", placeId: place.id })}
            onSubmitReview={handleSubmitReview}
            startWriting={Boolean(modal.writing)}
          />
        </Modal>
      )}
    </>
  );
}
