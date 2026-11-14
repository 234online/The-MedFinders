import { FEATURES, getCategory } from "../config/placeTypes.js";
import { TEXT } from "../config/texts.js";
import { Stars, ScoreBadge } from "./Stars.jsx";
import OpeningHours from "./OpeningHours.jsx";
import PopularTimes from "./PopularTimes.jsx";
import ContactActions from "./ContactActions.jsx";
import { placeDescription } from "../data/translations.js";
import { IconMapPin, IconStar, IconStarFilled } from "@tabler/icons-react";
import { CategoryIcon } from "./MedIcon.jsx";
import "./PlacePopup.css";

// What appears above a pin on the map when you click it
export default function PlacePopup({
  place,
  isFavorite,
  onToggleFavorite,
  onOpenDetails,
  requestSpecialty = null,
  user = null,
}) {
  const category = getCategory(place.category);
  const badges = FEATURES.filter((f) => place[f.id] === true);

  return (
    <div className="place-popup" style={{ "--cat": category.color }}>
      {/* Coloured band: what the place is */}
      <div className="pp-header">
        <span className="pp-type">
          <CategoryIcon id={category.id} size={14} /> {category.label}
        </span>
        <h3 className="pp-name">{place.name}</h3>
        {place.network !== "Independent" && <span className="pp-network">{place.network}</span>}
      </div>

      {/* Everything below: what you can do there */}
      <div className="pp-body">
        <button type="button" className="pp-score" onClick={() => onOpenDetails(place)}>
          <ScoreBadge score={place.score} />
          {place.score != null && <Stars value={place.score} size={13} />}
          <span className="pp-score-count">{TEXT.reviewsCount(place.reviewCount)}</span>
        </button>

        {place.notes && <p className="pp-desc">{placeDescription(place)}</p>}

        {place.address && (
          <p className="pp-address">
            <IconMapPin size={15} stroke={1.8} aria-hidden="true" /> {place.address}
          </p>
        )}

        <ContactActions place={place} specialty={requestSpecialty} user={user} compact />

        <OpeningHours place={place} compact />

        <PopularTimes place={place} compact />

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
            {isFavorite ? (
              <IconStarFilled size={16} aria-hidden="true" />
            ) : (
              <IconStar size={16} stroke={1.8} aria-hidden="true" />
            )}
            {isFavorite ? TEXT.saved : TEXT.save}
          </button>
        </div>
      </div>
    </div>
  );
}
