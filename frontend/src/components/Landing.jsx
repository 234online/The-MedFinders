import { useState } from "react";
import { CATEGORIES, FEATURES } from "../config/placeTypes.js";
import { TEXT } from "../config/texts.js";
import "./Landing.css";

// Services offered as quick buttons on the start page (ids from FEATURES)
const QUICK_FEATURES = ["open24h", "emergency", "cnas", "kids"];

// The start page: shown before the map opens.
//   counts      { categoryId: number of places }
//   onSearch    (text) => open the map with that search
//   onCategory  (categoryId) => open the map filtered to that category
//   onFeature   (featureId) => open the map with that service switched on
//   onShowAll   () => open the map with everything
//   children    extra things to show (the floating buttons)
export default function Landing({ counts, onSearch, onCategory, onFeature, onShowAll, children }) {
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
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className="landing-tile"
              style={{ "--tile-color": c.color }}
              onClick={() => onCategory(c.id)}
            >
              <span className="landing-tile-icon">{c.icon}</span>
              <span className="landing-tile-label">{c.label}</span>
              <span className="landing-tile-count">{TEXT.placesCount(counts[c.id] ?? 0)}</span>
            </button>
          ))}
        </div>

        <p className="landing-section">{TEXT.landingQuickTitle}</p>
        <div className="landing-quick">
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
