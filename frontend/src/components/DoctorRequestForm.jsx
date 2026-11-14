import { useEffect, useMemo, useState } from "react";
import { accountApi } from "../account/api.js";
import { places } from "../data/loadPlaces.js";
import { getCategory, SPECIALTIES } from "../config/placeTypes.js";
import { TEXT } from "../config/texts.js";
import "./panels.css";

// =============================================================
//  "I'm a doctor": request a doctor account for one or more clinics.
//  The account stays a patient account until an admin approves it
//  (doctors can read the medical details of their clinics' patients).
//  Shows the latest request's status if there is one.
//    compact   true inside "My account": starts as a single button
// =============================================================

const MAX_CLINICS = 10;

export default function DoctorRequestForm({ compact = false }) {
  const [request, setRequest] = useState(undefined); // undefined = loading, null = none
  const [open, setOpen] = useState(!compact);
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState([]);
  const [form, setForm] = useState({ specialty: "", licenseNumber: "", message: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    accountApi
      .getDoctorRequest()
      .then((r) => !cancelled && setRequest(r))
      .catch(() => !cancelled && setRequest(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const byId = useMemo(() => new Map(places.map((p) => [p.id, p])), []);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return places
      .filter((p) => !chosen.includes(p.id) && `${p.name} ${p.address ?? ""}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, chosen]);

  if (request === undefined) return null;

  // ---------- An earlier request ----------
  const canAskAgain = !request || request.status === "rejected";
  const status = request && (
    <div className={`doctor-request-status ${request.status}`}>
      <strong>{TEXT.doctorRequestStatus[request.status]}</strong>
      <small>
        {request.specialty} · {request.clinics?.map((c) => c.name).join(", ")}
      </small>
      {request.status === "approved" && <small>{TEXT.doctorRequestApprovedHint}</small>}
      {request.status === "rejected" && request.reviewNote && (
        <small>
          {TEXT.doctorRequestReason}: {request.reviewNote}
        </small>
      )}
    </div>
  );

  if (!canAskAgain) return <section className="doctor-request">{status}</section>;

  if (!open) {
    return (
      <section className="doctor-request">
        {status}
        <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
          {request ? TEXT.doctorRequestAgain : TEXT.doctorRequestOpen}
        </button>
      </section>
    );
  }

  // ---------- The form ----------
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const add = (id) => {
    if (chosen.length >= MAX_CLINICS) return;
    setChosen((prev) => [...prev, id]);
    setQuery("");
  };

  async function submit(e) {
    e.preventDefault();
    if (chosen.length === 0) return setError(TEXT.doctorRequestPickClinic);
    setSending(true);
    setError(null);
    try {
      setRequest(
        await accountApi.sendDoctorRequest({
          placeIds: chosen,
          specialty: form.specialty.trim(),
          licenseNumber: form.licenseNumber.trim(),
          message: form.message.trim(),
        })
      );
    } catch (err) {
      setError([400, 409].includes(err.status) ? err.message : TEXT.profileSaveError);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="doctor-request">
      {status}
      {/* In its own window the title is already in the window header */}
      {compact && <h3>{TEXT.doctorRequestTitle}</h3>}
      <p className="login-note account-note">{TEXT.doctorRequestIntro}</p>

      <form className="login-form" onSubmit={submit}>
        <label>
          {TEXT.doctorRequestClinics}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={TEXT.doctorRequestClinicSearch}
            disabled={chosen.length >= MAX_CLINICS}
          />
        </label>
        {matches.length > 0 && (
          <ul className="clinic-picker" role="listbox">
            {matches.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => add(p.id)}>
                  <strong>{p.name}</strong>
                  <small>
                    {getCategory(p.category).singular ?? getCategory(p.category).label}
                    {p.address && ` · ${p.address}`}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        )}
        {chosen.length > 0 && (
          <ul className="clinic-chips">
            {chosen.map((id) => (
              <li key={id}>
                {byId.get(id)?.name ?? id}
                <button
                  type="button"
                  aria-label={`${TEXT.removeFavorite}: ${byId.get(id)?.name ?? id}`}
                  onClick={() => setChosen((prev) => prev.filter((x) => x !== id))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <label>
          {TEXT.doctorRequestSpecialty}
          <input
            value={form.specialty}
            onChange={set("specialty")}
            list="doctor-specialties"
            minLength={2}
            maxLength={120}
            required
          />
          <datalist id="doctor-specialties">
            {SPECIALTIES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label>
          {TEXT.doctorRequestLicense}
          <input
            value={form.licenseNumber}
            onChange={set("licenseNumber")}
            placeholder="ex. 123456"
            pattern="[A-Za-z0-9][A-Za-z0-9 \-]{2,29}"
            maxLength={30}
            required
          />
        </label>
        <label>
          {TEXT.doctorRequestMessage}
          <textarea rows={2} value={form.message} onChange={set("message")} maxLength={500} />
        </label>

        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? TEXT.profileSaving : TEXT.doctorRequestSend}
        </button>
      </form>
    </section>
  );
}
