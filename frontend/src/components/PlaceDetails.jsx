import { useState } from "react";
import { FEATURES, getCategory } from "../config/placeTypes.js";
import { TEXT } from "../config/texts.js";
import { ratingBreakdown } from "../reviews/score.js";
import { Stars, StarInput } from "./Stars.jsx";
import OpeningHours from "./OpeningHours.jsx";
import "./panels.css";
import "./PlaceDetails.css";

// The "Recenzii și detalii" window for one place
export default function PlaceDetails({
  place,
  reviews,
  user,
  isFavorite,
  onToggleFavorite,
  onLoginToReview,
  onSubmitReview,
  startWriting = false,
}) {
  const category = getCategory(place.category);
  const badges = FEATURES.filter((f) => place[f.id] === true);
  const breakdown = ratingBreakdown(reviews);
  const [writing, setWriting] = useState(startWriting && Boolean(user));

  return (
    <div className="details">
      {/* ---------- Header ---------- */}
      <div className="details-head">
        <span className="details-icon" style={{ background: category.color }}>
          {category.icon}
        </span>
        <div>
          <span className="details-type" style={{ color: category.color }}>
            {category.label}
            {place.area && ` · ${place.area}`}
          </span>
          <h3>{place.name}</h3>
        </div>
      </div>

      {place.description && <p className="details-desc">{place.description}</p>}

      {/* ---------- Info grid ---------- */}
      <div className="details-grid">
        <div className="details-box">
          <h4>{TEXT.contactTitle}</h4>
          {place.address && <p>📍 {place.address}</p>}
          {place.phone && (
            <p>
              <a href={`tel:${place.phone.replace(/\s/g, "")}`}>📞 {place.phone}</a>
            </p>
          )}
        </div>
        <OpeningHours place={place} />
      </div>

      {place.specialties?.length > 0 && (
        <div className="details-tags">
          <h4>{TEXT.specialtiesTitle}</h4>
          {place.specialties.map((s) => (
            <span key={s} className="details-tag">
              {s}
            </span>
          ))}
        </div>
      )}

      {badges.length > 0 && (
        <div className="details-tags">
          <h4>{TEXT.servicesTitle}</h4>
          {badges.map((f) => (
            <span key={f.id} className="details-tag services">
              ✓ {f.label}
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

      {/* ---------- Score summary ---------- */}
      <h4 className="details-section-title">{TEXT.reviewsTitle}</h4>
      <div className="score-summary">
        <div className="score-big">
          <span className="score-number">{place.score != null ? place.score.toFixed(1) : "–"}</span>
          <Stars value={place.score} size={16} />
          <span className="score-count">{TEXT.reviewsCount(place.reviewCount)}</span>
        </div>
        <div className="score-bars">
          {breakdown.map(({ stars, count }) => (
            <div key={stars} className="score-bar-row">
              <span>{stars} ★</span>
              <div className="score-bar">
                <div
                  className="score-bar-fill"
                  style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : 0 }}
                />
              </div>
              <span className="score-bar-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Write a review ---------- */}
      {!writing && (
        <button
          type="button"
          className="btn-write"
          onClick={() => (user ? setWriting(true) : onLoginToReview(place))}
        >
          ✍️ {user ? TEXT.writeReview : TEXT.loginToReviewButton}
        </button>
      )}

      {writing && (
        <ReviewForm
          onCancel={() => setWriting(false)}
          onSubmit={(review) => {
            onSubmitReview(place, review);
            setWriting(false);
          }}
        />
      )}

      {/* ---------- Review list ---------- */}
      {reviews.length === 0 ? (
        <p className="details-muted">{TEXT.noReviews}</p>
      ) : (
        <ul className="review-list">
          {reviews.map((r, i) => (
            <li key={r.id ?? i} className="review">
              <div className="review-head">
                <span className="review-avatar">{r.author?.[0]?.toUpperCase() ?? "?"}</span>
                <div>
                  <strong>{r.author}</strong>
                  {user && r.authorEmail === user.email && (
                    <span className="review-mine">{TEXT.yourReviewTag}</span>
                  )}
                  <div className="review-meta">
                    <Stars value={r.rating} size={12} /> <span>{r.date}</span>
                  </div>
                </div>
              </div>
              <p>{r.text}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="details-muted">{TEXT.demoReviewsNote}</p>
    </div>
  );
}

function ReviewForm({ onSubmit, onCancel }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (rating < 1) return setError(TEXT.reviewNeedsRating);
    if (text.trim().length < 5) return setError(TEXT.reviewTooShort);
    onSubmit({ rating, text });
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <label>{TEXT.yourRating}</label>
      <StarInput value={rating} onChange={setRating} />
      <label htmlFor="review-text">{TEXT.yourReview}</label>
      <textarea
        id="review-text"
        rows={4}
        value={text}
        placeholder={TEXT.reviewPlaceholder}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />
      {error && <p className="login-error">{error}</p>}
      <div className="review-form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {TEXT.cancel}
        </button>
        <button type="submit" className="btn-primary">
          {TEXT.submitReview}
        </button>
      </div>
    </form>
  );
}

