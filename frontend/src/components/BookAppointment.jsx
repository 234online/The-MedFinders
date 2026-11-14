import { useState } from "react";
import { accountApi } from "../account/api.js";
import { TEXT } from "../config/texts.js";
import "./panels.css";

const isoDay = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// "Book online" form for one clinic. The booking is saved in the
// appointments table and shows up on the clinic's doctor dashboard.
//   place      the clinic
//   onDone     () => called after closing the success message
export default function BookAppointment({ place, onDone }) {
  const tomorrow = new Date(Date.now() + 864e5);
  const lastDay = new Date();
  lastDay.setFullYear(lastDay.getFullYear() + 1);

  const [form, setForm] = useState({ date: isoDay(tomorrow), time: "09:00", reason: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await accountApi.bookAppointment({ placeId: place.id, ...form, reason: form.reason.trim() });
      setDone(true);
    } catch (err) {
      setError([400, 429].includes(err.status) ? err.message : TEXT.bookError);
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

  return (
    <form className="login-form" onSubmit={submit}>
      <p className="saved-user">
        <strong>{place.name}</strong>
      </p>
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
