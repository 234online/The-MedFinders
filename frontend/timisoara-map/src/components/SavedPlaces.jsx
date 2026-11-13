import { getCategory } from "../config/placeTypes.js";
import { TEXT } from "../config/texts.js";
import "./panels.css";

// The "my account" page: saved places + log out
export default function SavedPlaces({ user, places, onSelect, onRemove, onLogout }) {
  return (
    <div className="saved">
      <div className="saved-user">
        {user.picture && (
          <img src={user.picture} alt="" className="saved-avatar" referrerPolicy="no-referrer" />
        )}
        <span>
          {TEXT.loggedInAs} <strong>{user.name}</strong>
          <small>{user.email}</small>
        </span>
      </div>

      <h3>
        {TEXT.savedTitle} ({places.length})
      </h3>

      {places.length === 0 ? (
        <p className="saved-empty">{TEXT.savedEmpty}</p>
      ) : (
        <ul className="saved-list">
          {places.map((p) => {
            const category = getCategory(p.category);
            return (
              <li key={p.id}>
                <button type="button" className="saved-item" onClick={() => onSelect(p)}>
                  <span className="saved-dot" style={{ background: category.color }} />
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {category.label}
                      {p.phone && ` · ${p.phone}`}
                    </small>
                  </span>
                </button>
                <button
                  type="button"
                  className="saved-remove"
                  onClick={() => onRemove(p)}
                  aria-label={TEXT.removeFavorite}
                  title={TEXT.removeFavorite}
                >
                  ★
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" className="btn-secondary" onClick={onLogout}>
        {TEXT.logout}
      </button>
    </div>
  );
}
