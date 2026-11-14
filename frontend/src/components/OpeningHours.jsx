import { TEXT } from "../config/texts.js";
import { useOpeningHours } from "../services/openingHours.js";
import "./PlacePopup.css";

// The weekly schedule box (used in the popup and the details window)
//   compact  only today's hours, the full week opens on click (map popup)
export default function OpeningHours({ place, compact = false }) {
  const { loading, hours } = useOpeningHours(place);
  const today = (new Date().getDay() + 6) % 7; // 0 = Monday

  return (
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
      {!loading && hours && compact && (
        <>
          <p className="pp-today">
            {TEXT.hoursToday}: <strong>{hours.days[today]}</strong>
          </p>
          <details className="pp-week">
            <summary>{TEXT.hoursWeek}</summary>
            <WeekTable hours={hours} today={today} />
          </details>
        </>
      )}
      {!loading && hours && !compact && <WeekTable hours={hours} today={today} />}
      {hours?.source === "google" && <p className="pp-muted">{TEXT.hoursFromGoogle}</p>}
    </div>
  );
}

function WeekTable({ hours, today }) {
  return (
    <table className="pp-days">
      <tbody>
        {hours.days.map((text, i) => (
          <tr key={i} className={i === today ? "today" : ""}>
            <td>{TEXT.days[i]}</td>
            <td>
              {text}
              {hours.notes?.[i] && <small className="pp-day-note">{hours.notes[i]}</small>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
