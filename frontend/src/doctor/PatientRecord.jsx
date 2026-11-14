import { IconAlertTriangle, IconDroplet, IconMail, IconPhone } from "@tabler/icons-react";
import { DTEXT } from "./doctorTexts.js";
import { doctorApi, useDoctorData } from "./doctorApi.js";
import { ageFrom, formatDate } from "./dates.js";

// A patient's medical record (opened from the doctor dashboard).
//   id             patient id
//   appointments   this patient's appointments at the doctor's clinic
export default function PatientRecord({ id, lang, appointments = [] }) {
  const { data: p, loading, error } = useDoctorData(() => doctorApi.getPatient(id), id);

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

      {appointments.length > 0 && (
        <section>
          <h4>{DTEXT.appointmentsTitle}</h4>
          <ul className="doc-mini">
            {appointments.map((a) => (
              <li key={a.id}>
                <span>
                  {formatDate(a.date, lang)} · {a.time} — {a.reason}
                </span>
                <span className={`doc-status ${a.status}`}>{DTEXT.status[a.status]}</span>
              </li>
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
