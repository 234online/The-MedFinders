import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { places } from "./data/loadPlaces.js";
import SearchBar from "./SearchBar.jsx";
import FilterPanel from "./filters/FilterPanel.jsx";
import Landing from "./components/Landing.jsx";
import DoctorDashboard from "./doctor/DoctorDashboard.jsx";
import FloatingButton from "./components/FloatingButton.jsx";
import Modal from "./components/Modal.jsx";
import PlacePopup from "./components/PlacePopup.jsx";
import PlaceDetails from "./components/PlaceDetails.jsx";
import LoginForm from "./components/LoginForm.jsx";
import Auth0Login from "./components/Auth0Login.jsx";
import SavedPlaces from "./components/SavedPlaces.jsx";
import { ScoreBadge } from "./components/Stars.jsx";
import Documentation from "./content/Documentation.jsx";
import SymptomGuide from "./components/SymptomGuide.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import AccessibleToggle from "./accessibility/AccessibleToggle.jsx";
import { useAccessibleMode } from "./accessibility/useAccessibleMode.js";
import { useAccount } from "./account/useAccount.js";
import { useReviews } from "./reviews/useReviews.js";
import { getReviews, getScore } from "./reviews/score.js";
import { FILTERS } from "./config/filters.js";
import { SORT_OPTIONS, sortPlaces } from "./config/sorting.js";
import { getCategory, SPECIALTY_GROUPS } from "./config/placeTypes.js";
import { applyFilters, getDefaults } from "./filters/filterEngine.js";
import { markerIcon } from "./map/markerIcons.js";
import { TEXT, getLanguage, setLanguage } from "./config/texts.js";
import { IconStethoscope } from "@tabler/icons-react";
import { LogoIcon, CategoryIcon } from "./components/MedIcon.jsx";
import "./App.css";
import "./accessibility/accessible.css";

// Centre of Timișoara (around Piața Victoriei)
const CENTER = [45.7537, 21.2257];

// Icons for the floating buttons: replace these files in the public folder
const INFO_ICON = "/info-icon.svg";
const ACCOUNT_ICON = "/user-icon.svg";

export default function App() {
  // false = start page, true = map
  const [started, setStarted] = useState(false);

  // The doctor dashboard lives at "#doctor" (a hash, so it works on
  // Vercel without extra rewrites and the back button works)
  const [doctorPage, setDoctorPage] = useState(() => window.location.hash === "#doctor");
  useEffect(() => {
    const onHash = () => setDoctorPage(window.location.hash === "#doctor");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  function openDoctorPage(open) {
    if (open) window.location.hash = "doctor";
    else history.pushState(null, "", window.location.pathname + window.location.search);
    setDoctorPage(open);
  }

  // Interface language ("ro" | "en" | "hu"); changing it re-draws everything
  const [lang, setLang] = useState(getLanguage);
  function changeLanguage(next) {
    setLanguage(next);
    setLang(next);
  }
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Accessible mode (bigger text, more contrast)
  const [accessible, toggleAccessible] = useAccessibleMode();

  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState(() => getDefaults(FILTERS));
  const [sortId, setSortId] = useState("relevance");
  const [selectedId, setSelectedId] = useState(null);
  const [map, setMap] = useState(null);
  const markerRefs = useRef({});

  // Open window: null | { type: "docs" | "login" | "account" | "details" | "symptoms", placeId?, writing? }
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

  const results = useMemo(
    () => sortPlaces(applyFilters(allPlaces, FILTERS, filterValues, query), sortId),
    [allPlaces, filterValues, query, sortId]
  );
  const resultIds = useMemo(() => new Set(results.map((p) => p.id)), [results]);
  const favoritePlaces = allPlaces.filter((p) => account.favorites.includes(p.id));

  // How many places offer each specialty domain (for the start page tiles)
  const countsByGroup = useMemo(() => {
    const counts = {};
    for (const g of SPECIALTY_GROUPS) {
      counts[g.id] = places.filter((p) =>
        (p.specialties ?? []).some((s) => g.items.includes(s))
      ).length;
    }
    return counts;
  }, []);

  // How many places of each type (for the second row of tiles)
  const countsByType = useMemo(() => {
    const counts = {};
    for (const p of places) counts[p.category] = (counts[p.category] ?? 0) + 1;
    return counts;
  }, []);

  // The specialty to mention in appointment messages: the first one
  // the user filtered for that this place offers
  function requestSpecialtyFor(place) {
    return (filterValues.specialties ?? []).find((s) => place.specialties.includes(s)) ?? null;
  }

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

  // ---------- Coming back from the Auth0 login page ----------
  // The page reloads after logging in with Auth0, so we saved what the
  // user was doing (e.g. saving a place) and finish it here.
  useEffect(() => {
    if (account.isLoading || !account.user) return;
    const pending = account.takePendingAction();
    if (!pending) return;
    if (pending.started) setStarted(true);
    const action = pending.action;
    if (action?.type === "save") {
      account.addFavorite(action.placeId);
      const place = places.find((p) => p.id === action.placeId);
      if (place) selectPlace(place);
    } else if (action?.type === "review") {
      setModal({ type: "details", placeId: action.placeId, writing: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.isLoading, account.user]);

  // Auth0: go to the login page, remembering what to do afterwards
  function auth0Login(options = {}) {
    account.redirectToLogin({ ...options, pending: { action: pendingAction, started } });
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
        photo={account.user?.picture}
        onClick={openAccount}
      />
      <FloatingButton
        icon={INFO_ICON}
        label={TEXT.infoButton}
        // Map page: above the chat button. Start page: bottom left.
        position={started ? "above-chat" : "bottom-left"}
        onClick={() => setModal({ type: "docs" })}
      />
    </>
  );

  // Draw non-matching places first so highlighted ones sit on top
  const ordered = [...allPlaces].sort(
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
    <>
      {doctorPage ? (
        <DoctorDashboard
          user={account.user}
          onLogin={() => setModal({ type: "login" })}
          onExit={() => openDoctorPage(false)}
          lang={lang}
          onLanguage={changeLanguage}
          accessible={accessible}
          onToggleAccessible={toggleAccessible}
        />
      ) : !started ? (
        <Landing
          counts={countsByGroup}
          onSearch={(text) => startWith({ text })}
          typeCounts={countsByType}
          onGroup={(group) => startWith({ filters: { specialties: group.items } })}
          onCategory={(id) => startWith({ filters: { category: [id] } })}
          onFeature={(id) => startWith({ filters: { [id]: true } })}
          onShowAll={() => startWith()}
          onSymptoms={() => setModal({ type: "symptoms" })}
          lang={lang}
          onLanguage={changeLanguage}
          accessible={accessible}
          onToggleAccessible={toggleAccessible}
          onDoctorPortal={() => openDoctorPage(true)}
        >
          {floatingButtons}
        </Landing>
      ) : (
        <div className="layout">
          <aside className="sidebar">
            <button type="button" className="brand" onClick={goHome} title={TEXT.backHome}>
              <span className="brand-logo">
                <LogoIcon />
              </span>
              <span>
                <strong>{TEXT.brand}</strong>
                <small>{TEXT.appTitle}</small>
              </span>
            </button>

            <div className="sidebar-tools">
              <AccessibleToggle on={accessible} onToggle={toggleAccessible} />
              <LanguageSwitcher value={lang} onChange={changeLanguage} />
            </div>

            <button type="button" className="sidebar-symptom" onClick={() => setModal({ type: "symptoms" })}>
              <IconStethoscope size={18} stroke={1.8} aria-hidden="true" /> {TEXT.symptomButton}
            </button>

            <FilterPanel
              filters={FILTERS}
              values={filterValues}
              onChange={setFilter}
              onReset={resetFilters}
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
                    <span className="result-icon" style={{ background: `color-mix(in srgb, ${category.color} 14%, white)`, color: category.color }}>
                      <CategoryIcon id={category.id} size={18} />
                    </span>
                    <div className="result-text">
                      <strong>{p.name}</strong>
                      <small>
                        {category.singular}
                        {p.network !== "Independent" && ` · ${p.network}`}
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
                    <Popup
                      minWidth={250}
                      maxWidth={280}
                      className="mf-popup"
                      autoPanPaddingTopLeft={[20, 96]} // keep clear of the search button
                    >
                      <PlacePopup
                        place={p}
                        isFavorite={account.isFavorite(p.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenDetails={openDetails}
                        requestSpecialty={requestSpecialtyFor(p)}
                        user={account.user}
                      />
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      )}

      {/* ---------- Chat assistant (on every public page) ---------- */}
      {!doctorPage && (
        <ChatPanel
          places={allPlaces}
          onSelectPlace={(id) => {
            const place = allPlaces.find((p) => p.id === id);
            if (!place) return;
            if (!started) startWith();
            selectPlace(place);
          }}
          onShowResults={({ filters, text }) => startWith({ filters, text })}
        />
      )}

      {/* ---------- Windows ---------- */}
      {modal?.type === "symptoms" && (
        <Modal title={TEXT.symptomTitle} onClose={closeModal} width={720}>
          <SymptomGuide
            places={places}
            onShow={({ filters }) => {
              closeModal();
              startWith({ filters });
            }}
          />
        </Modal>
      )}

      {modal?.type === "docs" && (
        <Modal title={TEXT.docsTitle} onClose={closeModal} width={640}>
          <Documentation />
        </Modal>
      )}

      {modal?.type === "login" && (
        <Modal title={TEXT.loginTitle} onClose={closeModal} width={400}>
          {account.mode === "auth0" ? (
            <Auth0Login
              notice={loginNotice}
              onLogin={() => auth0Login()}
              onSignup={() => auth0Login({ signup: true })}
              onGoogle={() => auth0Login({ google: true })}
            />
          ) : (
            <LoginForm notice={loginNotice} onSubmit={handleLogin} />
          )}
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
            requestSpecialty={requestSpecialtyFor(detailsPlace)}
          />
        </Modal>
      )}
    </>
  );
}
