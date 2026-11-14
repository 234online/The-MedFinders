import { useState } from "react";
import { IconAlertTriangle, IconDroplet, IconMail, IconPhone } from "@tabler/icons-react";
import { DTEXT } from "./doctorTexts.js";
import { doctorApi, useDoctorData } from "./doctorApi.js";
import { ageFrom, formatDate } from "./dates.js";
import DocumentList from "../components/DocumentList.jsx";

// A patient's medical record (opened from the doctor dashboard).
//   id             patient id
//   appointments   this patient's appointments at the doctor's clinic
//   onUpdate       (appointmentId, { status, diagnosis?, notes? }) => Promise
export default function PatientRecord({ id, lang, appointments = [], onUpdate }) {
  // Reloaded after completing a visit, so the history shows it
  const [reload, setReload] = useState(0);
  const { data: p, loading, error } = useDoctorData(() => doctorApi.getPatient(id), `${id}:${reload}`);

  if (loading) return <p className="doc-message">{DTEXT.loading}</p>;
  if (error || !p) return <p className="doc-message">{DTEXT.loadError}</p>;

  return (
    <div className="doc-record">
      <div className="doc-record-head">
        <div>
          <h3>{p.name}</h3>
          <p>
            {DTEXT.years(ageFrom(p.birthDate))}
            {p.sex && ` · ${DTEXT.sex[p.sex]}`} · {DTEXT.born}: {formatDate(p.birthDate, lang, { long: true })}
          </p>
        </div>
        {p.bloodType && (
          <span className="doc-blood" title={DTEXT.bloodType}>
            <IconDroplet size={16} stroke={2} aria-hidden="true" /> {p.bloodType}
          </span>
        )}
      </div>

      <div className="doc-contact">
        {p.phone && (
          <a href={`tel:${p.phone.replace(/\s/g, "")}`}>
            <IconPhone size={16} stroke={1.8} aria-hidden="true" /> {p.phone}
          </a>
        )}
        {p.email && (
          <a href={`mailto:${p.email}`}>
            <IconMail size={16} stroke={1.8} aria-hidden="true" /> {p.email}
          </a>
        )}
      </div>

      {p.allergies?.length > 0 && (
        <div className="doc-alert" role="alert">
          <IconAlertTriangle size={18} stroke={2} aria-hidden="true" />
          <span>
            <strong>{DTEXT.allergies}:</strong> {p.allergies.join(", ")}
          </span>
        </div>
      )}

      <div className="doc-record-grid">
        <section>
          <h4>{DTEXT.conditions}</h4>
          <List items={p.conditions} />
        </section>
        <section>
          <h4>{DTEXT.medications}</h4>
          <List items={p.medications?.map((m) => `${m.name}${m.dose ? ` — ${m.dose}` : ""}`)} />
        </section>
      </div>

      <section>
        <h4>{DTEXT.documents}</h4>
        {p.documents?.length ? (
          <DocumentList documents={p.documents} loadFile={(d) => doctorApi.getPatientDocumentFile(p.id, d.id)} />
        ) : (
          <p className="doc-none">{DTEXT.documentsNone}</p>
        )}
      </section>

      {appointments.length > 0 && (
        <section>
          <h4>{DTEXT.appointmentsTitle}</h4>
          <ul className="doc-mini">
            {appointments.map((a) => (
              <AppointmentRow
                key={a.id}
                appointment={a}
                lang={lang}
                onUpdate={onUpdate}
                onCompleted={() => setReload((n) => n + 1)}
              />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h4>{DTEXT.visits}</h4>
        {p.visits?.length ? (
          <ol className="doc-timeline">
            {p.visits.map((v, i) => (
              <li key={i}>
                <small>
                  {formatDate(v.date, lang, { long: true })} · {v.clinic}
                  {v.doctor && v.doctor !== "—" && ` · ${v.doctor}`}
                </small>
                <strong>{v.reason}</strong>
                {v.diagnosis && (
                  <p>
                    <em>{DTEXT.diagnosis}:</em> {v.diagnosis}
                  </p>
                )}
                {v.notes && (
                  <p>
                    <em>{DTEXT.notes}:</em> {v.notes}
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="doc-none">{DTEXT.none}</p>
        )}
      </section>
    </div>
  );
}

// One appointment with the doctor's actions:
//   pending -> confirm / complete / cancel;  confirmed -> complete / cancel
function AppointmentRow({ appointment: a, lang, onUpdate, onCompleted }) {
  const [completing, setCompleting] = useState(false);
  const [form, setForm] = useState({ diagnosis: a.diagnosis ?? "", notes: a.notes ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const open = a.status === "pending" || a.status === "confirmed";

  async function run(patch) {
    setBusy(true);
    setError(false);
    try {
      await onUpdate(a.id, patch);
      if (patch.status === "completed") {
        setCompleting(false);
        onCompleted();
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="doc-appt-row">
      <div className="doc-appt-line">
        <span>
          {formatDate(a.date, lang)} · {a.time} — {a.reason}
        </span>
        <span className={`doc-status ${a.status}`}>{DTEXT.status[a.status]}</span>
      </div>

      {onUpdate && open && !completing && (
        <div className="doc-actions">
          {a.status === "pending" && (
            <button type="button" className="doc-action primary" disabled={busy} onClick={() => run({ status: "confirmed" })}>
              {DTEXT.actionConfirm}
            </button>
          )}
          <button type="button" className="doc-action primary" disabled={busy} onClick={() => setCompleting(true)}>
            {DTEXT.actionComplete}
          </button>
          <button
            type="button"
            className="doc-action"
            disabled={busy}
            onClick={() => window.confirm(DTEXT.cancelConfirm) && run({ status: "cancelled" })}
          >
            {DTEXT.actionCancel}
          </button>
        </div>
      )}

      {completing && (
        <form
          className="doc-complete"
          onSubmit={(e) => {
            e.preventDefault();
            run({ status: "completed", diagnosis: form.diagnosis, notes: form.notes });
          }}
        >
          <strong>{DTEXT.completeTitle}</strong>
          <label>
            {DTEXT.diagnosis}
            <input value={form.diagnosis} maxLength={500} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
          </label>
          <label>
            {DTEXT.notes}
            <textarea rows={3} value={form.notes} maxLength={4000} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
          <div className="doc-actions">
            <button type="submit" className="doc-action primary" disabled={busy}>
              {DTEXT.saveVisit}
            </button>
            <button type="button" className="doc-action" onClick={() => setCompleting(false)}>
              {DTEXT.actionCancel}
            </button>
          </div>
        </form>
      )}

      {error && <p className="doc-error">{DTEXT.actionError}</p>}
    </li>
  );
}

function List({ items }) {
  if (!items?.length) return <p className="doc-none">{DTEXT.none}</p>;
  return (
    <ul className="doc-bullets">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
