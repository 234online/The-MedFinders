import { useState } from "react";
import { TEXT } from "../config/texts.js";
import { usePopularTimes } from "../services/analytics.js";
import "./PopularTimes.css";

const FIRST_HOUR = 6;
const LAST_HOUR = 22; // last bar starts at 22:00
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);
const AXIS = [6, 9, 12, 15, 18, 21];

// "Popular times" bar chart for one clinic: average contacts per hour.
//   compact  today only (map popup); otherwise a day picker (details window)
export default function PopularTimes({ place, compact = false }) {
  const data = usePopularTimes(place.id);
  const today = data?.now.dow ?? 1; // 1 = Monday
  const [chosen, setChosen] = useState(null);
  const day = chosen ?? today;

  if (!data) return null;

  // Too few real clicks for this clinic yet: hide in the popup, explain in details
  if (!data.enoughData) {
    if (compact) return null;
    return (
      <div className="busy">
        <strong>{TEXT.busyTitle}</strong>
        <p className="busy-source">{TEXT.busyNotEnough(data.total, data.minClicks)}</p>
      </div>
    );
  }

  const max = Math.max(...data.days.flat());
  if (max <= 0) return null;

  const values = data.days[day - 1];
  const isToday = day === today;

  return (
    <div className={"busy" + (compact ? " compact" : "")}>
      <div className="busy-head">
        <strong>{TEXT.busyTitle}</strong>
        {isToday && <span className={"busy-now " + data.now.level}>{TEXT.busyNow[data.now.level]}</span>}
      </div>

      {!compact && (
        <div className="busy-days" role="tablist">
          {TEXT.daysShort.map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={day === i + 1}
              className={day === i + 1 ? "active" : ""}
              onClick={() => setChosen(i + 1)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="busy-bars" role="img" aria-label={`${TEXT.busyTitle}: ${TEXT.days[day - 1]}`}>
        {HOURS.map((hour) => {
          const avg = values[hour];
          const now = isToday && hour === data.now.hour;
          return (
            <span key={hour} className={"busy-bar" + (now ? " now" : "")} title={TEXT.busyBar(hour, avg)}>
              <span style={{ height: `${Math.max((avg / max) * 100, avg > 0 ? 4 : 0)}%` }} />
            </span>
          );
        })}
      </div>
      <div className="busy-axis" aria-hidden="true">
        {AXIS.map((h) => (
          <span key={h} style={{ left: `${((h - FIRST_HOUR + 0.5) / HOURS.length) * 100}%` }}>
            {h}
          </span>
        ))}
      </div>

      <p className="busy-source">{TEXT.dataTiger}</p>
    </div>
  );
}
