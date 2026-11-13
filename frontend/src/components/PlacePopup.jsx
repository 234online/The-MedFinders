import { FEATURES, getCategory } from "../config/placeTypes.js";
import { TEXT } from "../config/texts.js";
import { useOpeningHours } from "../services/openingHours.js";
import "./PlacePopup.css";

// What appears above a dot on the map when you click it
export default function PlacePopup({ place, isFavorite, onToggleFavorite }) {
  const category = getCategory(place.category);
  const badges = FEATURES.filter((f) => place[f.id] === true);
  const { loading, hours } = useOpeningHours(place);
  const today = (new Date().getDay() + 6) % 7; // 0 = Monday

  return (
    <div className="place-popup">
      <span className="pp-type" style={{ color: category.color }}>
        {category.label}
      </span>
      <h3 className="pp-name">{place.name}</h3>

      {place.description && <p className="pp-desc">{place.description}</p>}

      <div className="pp-contact">
        {place.address && <span>📍 {place.address}</span>}
        {place.phone && (
          <a href={`tel:${place.phone.replace(/\s/g, "")}`}>📞 {place.phone}</a>
        )}
      </div>

      <div className="pp-hours">
        <div className="pp-hours-head">
          <strong>{TEXT.hoursTitle}</strong>
          {hours?.openNow != null && (
            <span className={"pp-status " + (hours.openNow ? "open" : "closed")}>
              {hours.openNow ? TEXT.openNow : TEXT.closedNow}
            </span>
          )}
        </div>

        {loading && <p className="pp-muted">{TEXT.hoursLoading}</p>}
        {!loading && !hours && <p className="pp-muted">{TEXT.hoursUnavailable}</p>}
        {!loading && hours && (
          <table className="pp-days">
            <tbody>
              {hours.days.map((text, i) => (
                <tr key={i} className={i === today ? "today" : ""}>
                  <td>{TEXT.days[i]}</td>
                  <td>{text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {hours?.source === "google" && <p className="pp-muted">{TEXT.hoursFromGoogle}</p>}
      </div>

      {badges.length > 0 && (
        <div className="pp-badges">
          {badges.map((f) => (
            <span key={f.id} className="pp-badge">
              {f.label}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        className={"pp-save" + (isFavorite ? " saved" : "")}
        onClick={() => onToggleFavorite(place)}
      >
        {isFavorite ? TEXT.saved : TEXT.save}
      </button>
    </div>
  );
}
