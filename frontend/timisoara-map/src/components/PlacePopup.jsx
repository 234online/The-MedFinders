import { FEATURES, getCategory } from "../config/placeTypes.js";
import { TEXT } from "../config/texts.js";
import { Stars, ScoreBadge } from "./Stars.jsx";
import OpeningHours from "./OpeningHours.jsx";
import { splitPhones } from "../utils/contact.js";
import "./PlacePopup.css";

// What appears above a pin on the map when you click it
export default function PlacePopup({ place, isFavorite, onToggleFavorite, onOpenDetails }) {
  const category = getCategory(place.category);
  const badges = FEATURES.filter((f) => place[f.id] === true);

  return (
    <div className="place-popup">
      <span className="pp-type" style={{ color: category.color }}>
        {category.icon} {category.label}
      </span>
      <h3 className="pp-name">{place.name}</h3>
      {place.network !== "Independent" && <span className="pp-network">{place.network}</span>}

      <button type="button" className="pp-score" onClick={() => onOpenDetails(place)}>
        <ScoreBadge score={place.score} />
        {place.score != null && <Stars value={place.score} size={13} />}
        <span className="pp-score-count">{TEXT.reviewsCount(place.reviewCount)}</span>
      </button>

      {place.description && <p className="pp-desc">{place.description}</p>}

      <div className="pp-contact">
        {place.address && <span>📍 {place.address}</span>}
        {splitPhones(place.phone).map((p) => (
          <a key={p.label} href={`tel:${p.tel}`}>
            📞 {p.label}
          </a>
        ))}
      </div>

      <OpeningHours place={place} />

      {badges.length > 0 && (
        <div className="pp-badges">
          {badges.map((f) => (
            <span key={f.id} className="pp-badge">
              {f.label}
            </span>
          ))}
        </div>
      )}

      <div className="pp-actions">
        <button type="button" className="pp-details" onClick={() => onOpenDetails(place)}>
          {TEXT.reviewsButton}
        </button>
        <button
          type="button"
          className={"pp-save" + (isFavorite ? " saved" : "")}
          onClick={() => onToggleFavorite(place)}
        >
          {isFavorite ? TEXT.saved : TEXT.save}
        </button>
      </div>
    </div>
  );
}
