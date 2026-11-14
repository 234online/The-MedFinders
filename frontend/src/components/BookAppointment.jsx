import { useEffect, useState } from "react";
import { accountApi, bookingApi } from "../account/api.js";
import { TEXT } from "../config/texts.js";
import "./panels.css";

const isoDay = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// "Book online" form for one clinic. The booking is saved in the
// appointments table and shows up on the doctor dashboard: of the chosen
// doctor, or of every doctor of the clinic when "any doctor" is picked.
//   place      the clinic
//   onDone     () => called after closing the success message
export default function BookAppointment({ place, onDone }) {
  const tomorrow = new Date(Date.now() + 864e5);
  const lastDay = new Date();
  lastDay.setFullYear(lastDay.getFullYear() + 1);

  const [form, setForm] = useState({ date: isoDay(tomorrow), time: "09:00", reason: "", doctorId: "" });
  const [doctors, setDoctors] = useState(null); // null = loading

  // The clinic's doctors on the site, to choose from
  useEffect(() => {
    let cancelled = false;
    bookingApi
      .doctors(place.id)
      .then((list) => !cancelled && setDoctors(list))
      .catch(() => !cancelled && setDoctors([]));
    return () => {
      cancelled = true;
    };
  }, [place.id]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await accountApi.bookAppointment({
        placeId: place.id,
        date: form.date,
        time: form.time,
        reason: form.reason.trim(),
        doctorId: form.doctorId ? Number(form.doctorId) : null,
      });
      setDone(true);
    } catch (err) {
      setError([400, 409, 429].includes(err.status) ? err.message : TEXT.bookError);
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="login-form">
        <p className="login-notice">{TEXT.bookDone}</p>
        <button type="button" className="btn-primary" onClick={onDone}>
          {TEXT.close}
        </button>
      </div>
    );
  }

  if (doctors === null) return <p className="saved-empty">{TEXT.profileLoading}</p>;
  if (doctors.length === 0) {
    return (
      <div className="login-form">
        <p className="saved-user">
          <strong>{place.name}</strong>
        </p>
        <p className="book-unavailable">{TEXT.bookUnavailable}</p>
        <button type="button" className="btn-secondary" onClick={onDone}>
          {TEXT.close}
        </button>
      </div>
    );
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <p className="saved-user">
        <strong>{place.name}</strong>
      </p>
      <label>
        {TEXT.bookDoctor}
        <select value={form.doctorId} onChange={set("doctorId")}>
          <option value="">{TEXT.bookAnyDoctor(doctors.length)}</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.specialty && ` — ${d.specialty}`}
            </option>
          ))}
        </select>
      </label>
      <div className="book-row">
        <label>
          {TEXT.bookDate}
          <input type="date" value={form.date} onChange={set("date")} min={isoDay(new Date())} max={isoDay(lastDay)} required />
        </label>
        <label>
          {TEXT.bookTime}
          <input type="time" value={form.time} onChange={set("time")} step={900} required />
        </label>
      </div>
      <label>
        {TEXT.bookReason}
        <textarea
          rows={3}
          value={form.reason}
          onChange={set("reason")}
          placeholder={TEXT.bookReasonPlaceholder}
          minLength={3}
          maxLength={300}
          required
        />
      </label>
      <p className="login-note">{TEXT.bookNote}</p>
      {error && <p className="login-error">{error}</p>}
      <button type="submit" className="btn-primary" disabled={sending}>
        {sending ? TEXT.bookSending : TEXT.bookSubmit}
      </button>
    </form>
  );
}
