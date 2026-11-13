import { useState } from "react";
import { SPECIALTY_GROUPS, CATEGORIES, FEATURES } from "../config/placeTypes.js";
import { TEXT } from "../config/texts.js";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import "./Landing.css";

// Quick buttons on the start page: filter ids from config/filters.js
const QUICK_FEATURES = ["open24h", "emergency", "kids"];

// The start page: shown before the map opens.
//   counts      { groupId: number of places offering that domain }
//   typeCounts  { categoryId: number of places of that type }
//   onCategory  (categoryId) => open the map filtered to that type of place
//   onSearch    (text) => open the map with that search
//   onGroup     (group) => open the map filtered to that specialty domain
//   onFeature   (featureId) => open the map with that service switched on
//   onShowAll   () => open the map with everything
//   onSymptoms  () => open the "Ce te doare?" guide
//   lang, onLanguage  current language and how to change it
//   children    extra things to show (the floating buttons)
export default function Landing({
  counts,
  typeCounts,
  onSearch,
  onGroup,
  onCategory,
  onFeature,
  onShowAll,
  onSymptoms,
  lang,
  onLanguage,
  children,
}) {
  const [text, setText] = useState("");
  const quickFilters = [
    { id: "openNow", label: TEXT.openNow },
    ...FEATURES.filter((f) => QUICK_FEATURES.includes(f.id)),
  ];

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(text.trim());
  }

  return (
    <div className="landing">
      <LanguageSwitcher value={lang} onChange={onLanguage} variant="light" />
      {children}

      <div className="landing-content">
        <div className="landing-brand">
          <span className="landing-logo">🩺</span>
          <span>{TEXT.brand}</span>
        </div>
        <h1>{TEXT.landingTitle}</h1>
        <p className="landing-subtitle">{TEXT.landingSubtitle}</p>

        <form className="landing-search" onSubmit={handleSubmit}>
          <img src="/search-icon.svg" alt="" />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={TEXT.landingSearchPlaceholder}
            autoFocus
          />
          <button type="submit">{TEXT.landingSearchButton}</button>
        </form>

        <button type="button" className="landing-symptom" onClick={onSymptoms}>
          🩺 {TEXT.symptomButton}
        </button>

        <p className="landing-section">{TEXT.landingCategoriesTitle}</p>
        <div className="landing-tiles">
          {SPECIALTY_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              className="landing-tile"
              style={{ "--tile-color": g.color }}
              onClick={() => onGroup(g)}
            >
              <span className="landing-tile-icon">{g.icon}</span>
              <span className="landing-tile-label">{g.label}</span>
              <span className="landing-tile-count">{TEXT.placesCount(counts[g.id] ?? 0)}</span>
            </button>
          ))}
        </div>

        <p className="landing-section">{TEXT.landingTypesTitle}</p>
        <div className="landing-tiles landing-types">
          {CATEGORIES.filter((c) => typeCounts[c.id] > 0).map((c) => (
            <button
              key={c.id}
              type="button"
              className="landing-tile"
              style={{ "--tile-color": c.color }}
              onClick={() => onCategory(c.id)}
            >
              <span className="landing-tile-icon">{c.icon}</span>
              <span className="landing-tile-label">{c.label}</span>
              <span className="landing-tile-count">{TEXT.placesCount(typeCounts[c.id] ?? 0)}</span>
            </button>
          ))}
        </div>

        <p className="landing-section">{TEXT.landingQuickTitle}</p>
        <div className="landing-quick">
          {quickFilters.map((f) => (
            <button key={f.id} type="button" onClick={() => onFeature(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        <button type="button" className="landing-all" onClick={onShowAll}>
          {TEXT.showAllMap}
        </button>
      </div>
    </div>
  );
}
