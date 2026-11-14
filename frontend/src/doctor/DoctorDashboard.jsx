import { useMemo, useState } from "react";
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconCalendarWeek,
  IconClockHour4,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react";
import { TEXT } from "../config/texts.js";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import AccessibleToggle from "../accessibility/AccessibleToggle.jsx";
import { LogoIcon } from "../components/MedIcon.jsx";
import Modal from "../components/Modal.jsx";
import PatientRecord from "./PatientRecord.jsx";
import { DOCTOR_API, doctorApi, useDoctorData } from "./doctorApi.js";
import { DTEXT } from "./doctorTexts.js";
import { ageFrom, formatDate, isoDay } from "./dates.js";
import "../components/Landing.css";
import "./DoctorDashboard.css";

const TABS = [
  { id: "today", label: () => DTEXT.tabToday },
  { id: "upcoming", label: () => DTEXT.tabUpcoming },
  { id: "past", label: () => DTEXT.tabPast },
  { id: "all", label: () => DTEXT.tabAll },
];

// The doctor's start page: same look as the public start page, but with
// the appointments made at their clinic and each patient's medical record.
//   user, onLogin      the logged-in account and how to open the login window;
//                      only accounts with role "doctor" get in (set in Auth0,
//                      see backend/auth0/README.md)
//   authLoading        true while Auth0 is still checking the login
//   onExit             back to the public site
//   lang, onLanguage, accessible, onToggleAccessible   same as on Landing
export default function DoctorDashboard({
  user,
  authLoading = false,
  onLogin,
  onExit,
  lang,
  onLanguage,
  accessible,
  onToggleAccessible,
}) {
  // Only doctors load anything; reload when the logged-in doctor changes
  const isDoctor = user?.role === "doctor";
  const key = isDoctor ? (user.id ?? user.email) : null;
  const profile = useDoctorData(doctorApi.getProfile, key);
  const appointments = useDoctorData(doctorApi.getAppointments, key);

  // Changes the doctor made (confirm / complete / cancel), on top of the loaded list
  const [changes, setChanges] = useState({});
  async function updateAppointment(id, patch) {
    const saved = await doctorApi.updateAppointment(id, patch);
    setChanges((prev) => ({ ...prev, [id]: { ...prev[id], ...patch, ...(DOCTOR_API ? saved : {}) } }));
  }

  const [tab, setTab] = useState("today");
  const [query, setQuery] = useState("");
  const [patientId, setPatientId] = useState(null);
  const [clinicFilter, setClinicFilter] = useState("all"); // "all" | clinic code

  const clinics = profile.data?.clinics ?? [];
  const clinicName = (id) => clinics.find((c) => c.id === id)?.name ?? id;
  const manyClinics = clinics.length > 1;

  const today = isoDay(new Date());
  const weekEnd = isoDay(new Date(Date.now() + 7 * 864e5));
  const all = useMemo(
    () =>
      (appointments.data ?? [])
        .map((a) => (changes[a.id] ? { ...a, ...changes[a.id] } : a))
        .filter((a) => clinicFilter === "all" || a.placeId === clinicFilter),
    [appointments.data, changes, clinicFilter]
  );

  // New requests from patients (not answered yet, not in the past)
  const requests = useMemo(
    () =>
      all
        .filter((a) => a.status === "pending" && a.date >= today)
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
    [all, today]
  );
  const [requestError, setRequestError] = useState(null);
  async function answerRequest(a, status) {
    if (status === "cancelled" && !window.confirm(DTEXT.declineConfirm)) return;
    setRequestError(null);
    try {
      await updateAppointment(a.id, { status });
    } catch {
      setRequestError(a.id);
    }
  }

  const stats = useMemo(
    () => ({
      today: all.filter((a) => a.date === today && a.status !== "cancelled").length,
      upcoming: all.filter((a) => a.date > today && a.date <= weekEnd && a.status !== "cancelled").length,
      pending: all.filter((a) => a.status === "pending" && a.date >= today).length,
      patients: new Set(all.map((a) => a.patient.id)).size,
    }),
    [all, today, weekEnd]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((a) => {
        if (tab === "today") return a.date === today;
        if (tab === "upcoming") return a.date > today;
        if (tab === "past") return a.date < today;
        return true;
      })
      .filter((a) => !q || a.patient.name.toLowerCase().includes(q) || a.reason.toLowerCase().includes(q))
      .sort((a, b) => {
        const order = `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
        return tab === "past" ? -order : order;
      });
  }, [all, tab, query, today]);

  const error = profile.error ?? appointments.error;
  const needsLogin = !authLoading && (!user || error?.status === 401);
  const noAccess = !needsLogin && !authLoading && (!isDoctor || error?.status === 403);
  const noClinic = DOCTOR_API && profile.data && clinics.length === 0;

  return (
    <div className="landing doctor">
      <div className="landing-tools">
        <LanguageSwitcher value={lang} onChange={onLanguage} variant="light" />
        <AccessibleToggle on={accessible} onToggle={onToggleAccessible} variant="light" />
      </div>
      <button type="button" className="doc-exit" onClick={onExit}>
        {DTEXT.backToSite}
      </button>

      <header className="landing-hero">
        <div className="landing-brand">
          <span className="landing-logo">
            <LogoIcon />
          </span>
          <span>
            {TEXT.brand} · {DTEXT.portal}
          </span>
        </div>
        <h1>{profile.data ? DTEXT.greeting(profile.data.name) : DTEXT.portal}</h1>
        {profile.data && (clinics.length > 0 || profile.data.specialty) && (
          <p className="landing-subtitle">
            {[profile.data.specialty, ...clinics.map((c) => c.name)].filter(Boolean).join(" · ")}
          </p>
        )}

        {isDoctor && !needsLogin && !noAccess && (
          <form className="landing-search" onSubmit={(e) => e.preventDefault()} role="search">
            <IconSearch className="landing-search-icon" size={22} stroke={1.8} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value) setTab("all");
              }}
              placeholder={DTEXT.searchPlaceholder}
              aria-label={DTEXT.searchPlaceholder}
            />
          </form>
        )}
      </header>

      <div className="landing-content doc-content">
        {!DOCTOR_API && <p className="doc-demo">{DTEXT.demoNote}</p>}

        {needsLogin ? (
          <div className="doc-message">
            <p>{DTEXT.needLogin}</p>
            <button type="button" className="landing-all" onClick={onLogin}>
              {DTEXT.loginButton}
            </button>
          </div>
        ) : noAccess ? (
          <p className="doc-message">{DTEXT.noAccess}</p>
        ) : noClinic ? (
          <p className="doc-message">{DTEXT.noClinic}</p>
        ) : error ? (
          <p className="doc-message">{DTEXT.loadError}</p>
        ) : authLoading || appointments.loading ? (
          <p className="doc-message">{DTEXT.loading}</p>
        ) : (
          <>
            {manyClinics && (
              <div className="doc-tabs doc-clinics" role="group" aria-label={DTEXT.allClinics}>
                {[{ id: "all", name: DTEXT.allClinics }, ...clinics].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={clinicFilter === c.id}
                    className={clinicFilter === c.id ? "active" : ""}
                    onClick={() => setClinicFilter(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* New requests: every doctor of the clinic sees them and can answer */}
            <section className="doc-requests" aria-live="polite">
              <div className="doc-requests-head">
                <p className="landing-section">
                  {DTEXT.requestsTitle} {requests.length > 0 && <span className="doc-count">{requests.length}</span>}
                </p>
                <small>{DTEXT.requestsHint}</small>
              </div>
              {requests.length === 0 ? (
                <p className="doc-empty">{DTEXT.requestsEmpty}</p>
              ) : (
                <ul className="doc-request-list">
                  {requests.map((a) => (
                    <li key={a.id} className="doc-request">
                      <button type="button" className="doc-request-main" onClick={() => setPatientId(a.patient.id)} title={DTEXT.openRecord}>
                        <strong>{a.patient.name}</strong>
                        <small>
                          {DTEXT.years(ageFrom(a.patient.birthDate))}
                          {a.patient.sex && ` · ${DTEXT.sex[a.patient.sex]}`}
                          {a.patient.allergies?.length > 0 && (
                            <span className="doc-allergy">
                              {" "}
                              · <IconAlertTriangle size={13} stroke={2} aria-hidden="true" /> {DTEXT.allergyAlert}
                            </span>
                          )}
                        </small>
                        <span className="doc-request-when">
                          {DTEXT.requestedFor} <strong>{formatDate(a.date, lang)} · {a.time}</strong>
                          {manyClinics && ` · ${clinicName(a.placeId)}`}
                        </span>
                        <span className="doc-reason">„{a.reason}”</span>
                      </button>
                      <div className="doc-actions">
                        <button type="button" className="doc-action primary" onClick={() => answerRequest(a, "confirmed")}>
                          {DTEXT.accept}
                        </button>
                        <button type="button" className="doc-action" onClick={() => answerRequest(a, "cancelled")}>
                          {DTEXT.decline}
                        </button>
                      </div>
                      {requestError === a.id && <p className="doc-error">{DTEXT.actionError}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="doc-stats">
              <Stat icon={IconCalendarEvent} value={stats.today} label={DTEXT.statToday} onClick={() => setTab("today")} />
              <Stat icon={IconCalendarWeek} value={stats.upcoming} label={DTEXT.statUpcoming} onClick={() => setTab("upcoming")} />
              <Stat icon={IconClockHour4} value={stats.pending} label={DTEXT.statPending} tone="warn" onClick={() => setTab("upcoming")} />
              <Stat icon={IconUsers} value={stats.patients} label={DTEXT.statPatients} onClick={() => setTab("all")} />
            </div>

            <div className="doc-list-head">
              <p className="landing-section">{DTEXT.appointmentsTitle}</p>
              <div className="doc-tabs" role="tablist">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    className={tab === t.id ? "active" : ""}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label()}
                  </button>
                ))}
              </div>
            </div>

            {shown.length === 0 ? (
              <p className="doc-empty">{DTEXT.noAppointments}</p>
            ) : (
              <ul className="doc-appointments">
                {shown.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={`doc-appt ${a.status}`}
                      onClick={() => setPatientId(a.patient.id)}
                      title={DTEXT.openRecord}
                    >
                      <span className="doc-when">
                        <strong>{a.time}</strong>
                        <small>{a.date === today ? DTEXT.tabToday : formatDate(a.date, lang)}</small>
                      </span>
                      <span className="doc-who">
                        <strong>{a.patient.name}</strong>
                        <small>
                          {DTEXT.years(ageFrom(a.patient.birthDate))}
                          {a.patient.sex && ` · ${DTEXT.sex[a.patient.sex]}`}
                        </small>
                        <span className="doc-reason">{a.reason}</span>
                        {(manyClinics || a.handledBy) && (
                          <small>
                            {[manyClinics && clinicName(a.placeId), a.handledBy && DTEXT.handledBy(a.handledBy)]
                              .filter(Boolean)
                              .join(" · ")}
                          </small>
                        )}
                      </span>
                      <span className="doc-side">
                        <span className={`doc-status ${a.status}`}>{DTEXT.status[a.status]}</span>
                        {a.patient.allergies?.length > 0 && (
                          <span className="doc-allergy" title={a.patient.allergies.join(", ")}>
                            <IconAlertTriangle size={14} stroke={2} aria-hidden="true" /> {DTEXT.allergyAlert}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {patientId && (
        <Modal title={DTEXT.recordTitle} onClose={() => setPatientId(null)} width={680}>
          <PatientRecord
            id={patientId}
            lang={lang}
            appointments={all.filter((a) => a.patient.id === patientId)}
            onUpdate={updateAppointment}
          />
        </Modal>
      )}
    </div>
  );
}

function Stat({ icon: Icon, value, label, tone, onClick }) {
  return (
    <button type="button" className={`doc-stat ${tone ?? ""}`} onClick={onClick}>
      <span className="doc-stat-icon">
        <Icon size={22} stroke={1.8} aria-hidden="true" />
      </span>
      <strong>{value}</strong>
      <small>{label}</small>
    </button>
  );
}
