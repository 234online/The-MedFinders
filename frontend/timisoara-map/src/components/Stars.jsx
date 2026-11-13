import { useState } from "react";
import { scoreColor } from "../reviews/score.js";
import { TEXT } from "../config/texts.js";
import "./Stars.css";

// ★★★★☆ (read-only)
export function Stars({ value, size = 14 }) {
  const filled = Math.round(value ?? 0);
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value ?? 0} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= filled ? "on" : "off"}>
          ★
        </span>
      ))}
    </span>
  );
}

// Clickable stars for writing a review
export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className="star-input" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          className={i <= shown ? "on" : "off"}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          aria-label={`${i} / 5`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

// Coloured "★ 4.6" pill, or "Nou" when there are no reviews
export function ScoreBadge({ score }) {
  return (
    <span className="score-badge" style={{ background: scoreColor(score) }}>
      {score == null ? TEXT.noScore : `★ ${score.toFixed(1)}`}
    </span>
  );
}
