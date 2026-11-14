import { useState } from "react";
import { SPECIALTY_GROUPS, CATEGORIES, FEATURES } from "../config/placeTypes.js";
import { TEXT } from "../config/texts.js";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import AccessibleToggle from "../accessibility/AccessibleToggle.jsx";
import { IconChartBar, IconSearch, IconStethoscope } from "@tabler/icons-react";
import { GroupIcon, CategoryIcon, LogoIcon } from "./MedIcon.jsx";
import { DTEXT } from "../doctor/doctorTexts.js";
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
//   onDoctorPortal    () => open the doctor dashboard
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
  onStats,
  lang,
  onLanguage,
  accessible,
  onToggleAccessible,
  onDoctorPortal,
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
      <div className="landing-tools">
        <LanguageSwitcher value={lang} onChange={onLanguage} variant="light" />
        <AccessibleToggle on={accessible} onToggle={onToggleAccessible} variant="light" />
      </div>
      {children}

      {/* Deep green band at the top: name, title and search */}
      <header className="landing-hero">
        <div className="landing-brand">
          <span className="landing-logo">
            <LogoIcon />
          </span>
          <span>{TEXT.brand}</span>
        </div>
        <h1>{TEXT.landingTitle}</h1>

        <form className="landing-search" onSubmit={handleSubmit}>
          <IconSearch className="landing-search-icon" size={22} stroke={1.8} aria-hidden="true" />
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
          <IconStethoscope size={20} stroke={1.8} aria-hidden="true" /> {TEXT.symptomButton}
        </button>
      </header>

      {/* Cream area below: ways to browse */}
      <div className="landing-content">

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
              <span className="landing-tile-icon">
                <GroupIcon id={g.id} />
              </span>
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
              <span className="landing-tile-icon">
                <CategoryIcon id={c.id} size={22} />
              </span>
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

        {onStats && (
          <button type="button" className="landing-stats" onClick={onStats}>
            <IconChartBar size={18} stroke={1.8} aria-hidden="true" /> {TEXT.statsLink}
          </button>
        )}

        {onDoctorPortal && (
          <button type="button" className="landing-doctor-link" onClick={onDoctorPortal}>
            {DTEXT.doctorLink}
          </button>
        )}
      </div>
    </div>
  );
}
