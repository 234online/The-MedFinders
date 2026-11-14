import { IconCurrentLocation, IconRoute, IconMapPin } from "@tabler/icons-react";
import { TEXT } from "../config/texts.js";
import { getCategory } from "../config/placeTypes.js";
import { formatDistance, directionsUrl } from "../utils/geo.js";
import { CategoryIcon } from "./MedIcon.jsx";
import "./NearMe.css";

// "Lângă mine" card at the top of the results (side panel).
//   location  { status, position, request } from useMyLocation()
//   nearest   { place, km } — the closest place among the current results
//             (so it follows the search and filters), or null
//   onShow    (place) => open it on the map
export default function NearMe({ location, nearest, onShow }) {
  const { status } = location;

  // Not asked yet: one button
  if (status === "idle") {
    return (
      <button type="button" className="nearme-ask" onClick={location.request}>
        <IconCurrentLocation size={18} stroke={1.8} aria-hidden="true" />
        {TEXT.nearMeButton}
      </button>
    );
  }

  if (status === "locating") {
    return <p className="nearme-msg">{TEXT.nearMeLocating}</p>;
  }

  if (status !== "ok") {
    return (
      <div className="nearme-msg error" role="status">
        <p>{TEXT.nearMeError[status] ?? TEXT.nearMeError.unavailable}</p>
        <button type="button" className="btn-link" onClick={location.request}>
          {TEXT.nearMeRetry}
        </button>
      </div>
    );
  }

  // Located, but nothing matches the search / filters
  if (!nearest) return <p className="nearme-msg">{TEXT.nearMeNone}</p>;

  const { place, km } = nearest;
  const category = getCategory(place.category);
  return (
    <section className="nearme" aria-label={TEXT.nearMeTitle}>
      <div className="nearme-head">
        <span className="nearme-title">
          <IconMapPin size={16} stroke={1.8} aria-hidden="true" /> {TEXT.nearMeTitle}
        </span>
        <span className="nearme-distance">{formatDistance(km)}</span>
      </div>

      <button type="button" className="nearme-place" onClick={() => onShow(place)}>
        <span
          className="nearme-icon"
          style={{ background: `color-mix(in srgb, ${category.color} 14%, white)`, color: category.color }}
        >
          <CategoryIcon id={category.id} size={20} />
        </span>
        <span className="nearme-text">
          <strong>{place.name}</strong>
          <small>{place.address}</small>
        </span>
      </button>

      <div className="nearme-actions">
        <button type="button" className="nearme-show" onClick={() => onShow(place)}>
          {TEXT.nearMeShow}
        </button>
        <a className="nearme-route" href={directionsUrl(place)} target="_blank" rel="noreferrer">
          <IconRoute size={16} stroke={1.8} aria-hidden="true" /> {TEXT.nearMeRoute}
        </a>
      </div>
      {km > 30 && <p className="nearme-far">{TEXT.nearMeFar}</p>}
    </section>
  );
}
