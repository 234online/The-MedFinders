import { useBookingClinics } from "../account/useBookingClinics.js";
import { TEXT } from "../config/texts.js";
import "./panels.css";

// "Book online" for one clinic, shown only when the clinic takes online
// appointments (it has doctors on the site); otherwise a short note.
//   compact   smaller, for the map popup
export default function BookButton({ place, onBook, compact = false }) {
  const counts = useBookingClinics();
  if (!counts) return null; // still loading

  const doctors = counts[place.id] ?? 0;
  if (doctors === 0) return <p className="book-unavailable">{TEXT.bookUnavailable}</p>;

  return (
    <button
      type="button"
      className={`btn-primary book-button${compact ? " popup-book" : ""}`}
      onClick={() => onBook(place)}
      title={TEXT.bookDoctorsCount(doctors)}
    >
      📅 {TEXT.bookButton}
    </button>
  );
}
