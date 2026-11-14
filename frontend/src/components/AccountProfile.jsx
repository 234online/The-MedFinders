import { useEffect, useMemo, useState } from "react";
import { accountApi } from "../account/api.js";
import { places } from "../data/loadPlaces.js";
import { TEXT, getLanguage } from "../config/texts.js";
import MedicalForm from "./MedicalForm.jsx";
import MyAppointments from "./MyAppointments.jsx";
import "./panels.css";

// =============================================================
//  "My account" -> profile + contact history, stored in the
//  PostgreSQL database on Render (through the backend).
//  Shown only when Auth0 and the backend are set up
//  (SERVER_ACCOUNT in account/useAccount.js).
// =============================================================

const FIELDS = ["name", "phone", "birth_date", "sex", "preferred_language"];
const LANGUAGE_OPTIONS = [
  { id: "ro", label: "Română" },
  { id: "en", label: "English" },
  { id: "hu", label: "Magyar" },
];

const toForm = (profile) => Object.fromEntries(FIELDS.map((f) => [f, profile?.[f] ?? ""]));

export default function AccountProfile({ onDeleted }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(toForm(null));
  const [contacts, setContacts] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { ok: boolean, text }

  const placeNames = useMemo(() => new Map(places.map((p) => [String(p.id), p.name])), []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([accountApi.getProfile(), accountApi.getContacts(10)])
      .then(([me, history]) => {
        if (cancelled) return;
        setProfile(me);
        setForm(toForm(me));
        setContacts(history);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") return <p className="saved-empty">{TEXT.profileLoading}</p>;
  if (status === "error") return <p className="login-error">{TEXT.profileLoadError}</p>;

  const changed = FIELDS.filter((f) => form[f] !== (profile[f] ?? ""));
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    if (changed.length === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await accountApi.updateProfile(Object.fromEntries(changed.map((f) => [f, form[f]])));
      setProfile(updated);
      setForm(toForm(updated));
      setMessage({ ok: true, text: TEXT.profileSaved });
    } catch (err) {
      setMessage({ ok: false, text: err.status === 400 ? err.message : TEXT.profileSaveError });
    } finally {
      setSaving(false);
    }
  }

  async function deleteData() {
    if (!window.confirm(TEXT.deleteAccountConfirm)) return;
    try {
      await accountApi.deleteAccount();
      onDeleted?.();
    } catch {
      setMessage({ ok: false, text: TEXT.profileSaveError });
    }
  }

  const dateFormat = new Intl.DateTimeFormat(getLanguage(), { dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <h3>{TEXT.profileTitle}</h3>
      <form className="login-form account-form" onSubmit={save}>
        <label>
          {TEXT.profileName}
          <input value={form.name} onChange={set("name")} autoComplete="name" maxLength={200} required />
        </label>
        <label>
          {TEXT.profilePhone}
          <input
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            autoComplete="tel"
            placeholder="07xx xxx xxx"
            maxLength={25}
          />
        </label>
        <label>
          {TEXT.profileBirthDate}
          <input
            type="date"
            value={form.birth_date}
            onChange={set("birth_date")}
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
          />
        </label>
        <label>
          {TEXT.profileSex}
          <select value={form.sex} onChange={set("sex")}>
            <option value="">—</option>
            {Object.entries(TEXT.sexOptions).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {TEXT.profileLanguage}
          <select value={form.preferred_language} onChange={set("preferred_language")}>
            <option value="">—</option>
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <p className="login-note account-note">{TEXT.profileWhy}</p>

        {message && <p className={message.ok ? "login-notice" : "login-error"}>{message.text}</p>}

        <button type="submit" className="btn-primary" disabled={saving || changed.length === 0}>
          {saving ? TEXT.profileSaving : TEXT.profileSave}
        </button>
      </form>

      {/* Patients: medical record + appointments (doctors see them on their dashboard) */}
      {profile.role !== "doctor" && (
        <>
          <MyAppointments />
          <MedicalForm />
        </>
      )}

      <h3>{TEXT.contactHistoryTitle}</h3>
      {contacts.length === 0 ? (
        <p className="saved-empty">{TEXT.contactHistoryEmpty}</p>
      ) : (
        <ul className="saved-list contact-history">
          {contacts.map((c) => (
            <li key={c.event_id}>
              <span>
                <strong>{placeNames.get(String(c.place_id)) ?? c.place_id}</strong>
                <small>
                  {TEXT.contactKind[c.kind] ?? c.kind}
                  {c.target && ` · ${c.target}`} · {dateFormat.format(new Date(c.created_at))}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="btn-link account-delete" onClick={deleteData}>
        {TEXT.deleteAccount}
      </button>
    </>
  );
}
