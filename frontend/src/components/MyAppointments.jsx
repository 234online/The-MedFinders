import { useEffect, useMemo, useState } from "react";
import { accountApi } from "../account/api.js";
import { places } from "../data/loadPlaces.js";
import { TEXT, getLanguage } from "../config/texts.js";
import "./panels.css";

// "My appointments" on the account page: appointments the patient booked
// with "Book online"; upcoming ones can be cancelled.
export default function MyAppointments() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(false);
  const placeNames = useMemo(() => new Map(places.map((p) => [String(p.id), p.name])), []);

  useEffect(() => {
    let cancelled = false;
    accountApi.getAppointments().then(
      (rows) => !cancelled && setList(rows),
      () => !cancelled && setError(true)
    );
    return () => {
      cancelled = true;
    };
  }, []);

  async function cancel(a) {
    if (!window.confirm(TEXT.cancelAppointmentConfirm)) return;
    try {
      const updated = await accountApi.cancelAppointment(a.id);
      setList((rows) => rows.map((r) => (r.id === a.id ? updated : r)));
    } catch {
      setError(true);
    }
  }

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const format = new Intl.DateTimeFormat(getLanguage(), { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <h3>{TEXT.myAppointmentsTitle}</h3>
      {error && <p className="login-error">{TEXT.profileLoadError}</p>}
      {list && list.length === 0 && <p className="saved-empty">{TEXT.myAppointmentsEmpty}</p>}
      {list && list.length > 0 && (
        <ul className="saved-list appointment-list">
          {list.map((a) => {
            const canCancel = ["pending", "confirmed"].includes(a.status) && a.date >= today;
            return (
              <li key={a.id}>
                <span>
                  <strong>{placeNames.get(String(a.placeId)) ?? a.placeId}</strong>
                  <small>
                    {format.format(new Date(`${a.date}T00:00:00`))} · {a.time} — {a.reason}
                  </small>
                  <small>{a.requestedDoctor ? a.requestedDoctor.name : TEXT.bookAnyDoctorShort}</small>
                  {a.diagnosis && <small>{a.diagnosis}</small>}
                </span>
                <span className="appointment-side">
                  <span className={`appt-status ${a.status}`}>{TEXT.appointmentStatus[a.status]}</span>
                  {canCancel && (
                    <button type="button" className="btn-link" onClick={() => cancel(a)}>
                      {TEXT.cancelAppointment}
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
