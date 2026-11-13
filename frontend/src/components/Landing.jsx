import { useState } from "react";
import { SPECIALTY_GROUPS, FEATURES } from "../config/placeTypes.js";
import { TEXT } from "../config/texts.js";
import "./Landing.css";

// Services offered as quick buttons on the start page (ids from FEATURES)
const QUICK_FEATURES = ["open24h", "emergency", "cnas", "kids"];

// The start page: shown before the map opens.
//   counts      { groupId: number of places offering that domain }
//   onSearch    (text) => open the map with that search
//   onGroup     (group) => open the map filtered to that specialty domain
//   onFeature   (featureId) => open the map with that service switched on
//   onShowAll   () => open the map with everything
//   children    extra things to show (the floating buttons)
export default function Landing({ counts, onSearch, onGroup, onFeature, onShowAll, children }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(text.trim());
  }

  return (
    <div className="landing">
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

        <p className="landing-section">{TEXT.landingQuickTitle}</p>
        <div className="landing-quick">
          <button type="button" onClick={() => onSearch(TEXT.pharmacySearch)}>
            {TEXT.landingPharmacies}
          </button>
          {FEATURES.filter((f) => QUICK_FEATURES.includes(f.id)).map((f) => (
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
