import { useState } from "react";
import { SYMPTOMS } from "../config/symptoms.js";
import { specialtyName } from "../config/placeTypes.js";
import { TEXT, pick } from "../config/texts.js";
import { normalize } from "../filters/filterEngine.js";
import "./panels.css";
import "./SymptomGuide.css";

// The "Ce te doare?" window.
//   places   all places (to count matching clinics)
//   onShow   ({ filters }) => open the map with these filters
export default function SymptomGuide({ places, onShow }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  // ---------- One symptom chosen ----------
  if (selected) {
    const clinicCount = places.filter((p) =>
      p.specialties.some((s) => selected.specialties.includes(s))
    ).length;
    const urgent = selected.level === "urgent";

    return (
      <div className="symptom">
        <button type="button" className="btn-link symptom-back" onClick={() => setSelected(null)}>
          {TEXT.symptomBack}
        </button>

        <h3 className="symptom-title">
          <span>{selected.icon}</span> {pick(selected.labels)}
        </h3>

        {selected.level === "emergency" && (
          <div className="symptom-emergency">
            <p>{TEXT.symptomEmergencyText}</p>
            <a className="symptom-112" href="tel:112">
              {TEXT.symptomCall112}
            </a>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onShow({ filters: { emergency: true } })}
            >
              🏥 {TEXT.symptomShowEmergency}
            </button>
          </div>
        )}

        {urgent && <p className="symptom-urgent">⏱️ {TEXT.symptomUrgentText}</p>}

        <div className="symptom-specialties">
          <h4>{TEXT.symptomRecommend}</h4>
          <div className="chips">
            {selected.specialties.map((s) => (
              <span key={s} className="symptom-chip">
                {specialtyName(s)}
              </span>
            ))}
          </div>
        </div>

        {clinicCount > 0 && (
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              onShow({ filters: { specialties: selected.specialties, ...(urgent && { openNow: true }) } })
            }
          >
            📍 {TEXT.symptomShowClinics(clinicCount)}
          </button>
        )}

        <p className="symptom-disclaimer">{TEXT.symptomDisclaimer}</p>
      </div>
    );
  }

  // ---------- List of symptoms ----------
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matches = (s) => {
    if (words.length === 0) return true;
    const text = normalize([s.labels.ro, s.labels.en, s.labels.hu, ...s.keywords].join(" "));
    return words.every((w) => text.includes(w));
  };
  const visible = SYMPTOMS.filter(matches);
  const emergencies = visible.filter((s) => s.level === "emergency");
  const others = visible.filter((s) => s.level !== "emergency");

  return (
    <div className="symptom">
      <p className="symptom-intro">{TEXT.symptomIntro}</p>
      <input
        className="symptom-search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={TEXT.symptomSearch}
        autoFocus
      />

      {visible.length === 0 && <p className="symptom-none">{TEXT.symptomNoMatch}</p>}

      {emergencies.length > 0 && (
        <>
          <h4 className="symptom-group emergency">🚨 {TEXT.symptomEmergencyGroup}</h4>
          <div className="symptom-list">
            {emergencies.map((s) => (
              <button key={s.id} type="button" className="symptom-item emergency" onClick={() => setSelected(s)}>
                <span className="symptom-icon">{s.icon}</span>
                {pick(s.labels)}
              </button>
            ))}
          </div>
        </>
      )}

      {others.length > 0 && (
        <>
          <h4 className="symptom-group">{TEXT.symptomCommonGroup}</h4>
          <div className="symptom-list">
            {others.map((s) => (
              <button
                key={s.id}
                type="button"
                className={"symptom-item" + (s.level === "urgent" ? " urgent" : "")}
                onClick={() => setSelected(s)}
              >
                <span className="symptom-icon">{s.icon}</span>
                {pick(s.labels)}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="symptom-disclaimer">{TEXT.symptomDisclaimer}</p>
    </div>
  );
}
