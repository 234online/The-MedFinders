import { useEffect, useState } from "react";
import { accountApi } from "../account/api.js";
import { TEXT } from "../config/texts.js";
import "./panels.css";

// "My medical record" on the account page (patients). Saved in the
// medical_profiles table; doctors see it only for patients who booked
// at their clinic (backend/routes/doctor.js).

const BLOOD_TYPES = ["0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const lines = (text) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

// "Metformin – 500 mg" -> { name: "Metformin", dose: "500 mg" }
function parseMedication(line) {
  const [name, ...rest] = line.split(/\s+[–—-]\s+|:\s+/);
  return { name: name.trim(), dose: rest.join(" – ").trim() };
}

const toForm = (m) => ({
  bloodType: m?.bloodType ?? "",
  allergies: (m?.allergies ?? []).join("\n"),
  conditions: (m?.conditions ?? []).join("\n"),
  medications: (m?.medications ?? []).map((x) => (x.dose ? `${x.name} – ${x.dose}` : x.name)).join("\n"),
});

export default function MedicalForm() {
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState(toForm(null));
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    accountApi.getMedical().then(
      (m) => {
        if (cancelled) return;
        setSaved(toForm(m));
        setForm(toForm(m));
        setStatus("ready");
      },
      () => !cancelled && setStatus("error")
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") return null;
  if (status === "error") return <p className="login-error">{TEXT.profileLoadError}</p>;

  const changed = JSON.stringify(form) !== JSON.stringify(saved);
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const result = await accountApi.saveMedical({
        bloodType: form.bloodType || null,
        allergies: lines(form.allergies),
        conditions: lines(form.conditions),
        medications: lines(form.medications).map(parseMedication),
      });
      setSaved(toForm(result));
      setForm(toForm(result));
      setMessage({ ok: true, text: TEXT.profileSaved });
    } catch (err) {
      setMessage({ ok: false, text: err.status === 400 ? err.message : TEXT.profileSaveError });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h3>{TEXT.medicalTitle}</h3>
      <form className="login-form account-form" onSubmit={save}>
        <label>
          {TEXT.bloodType}
          <select value={form.bloodType} onChange={set("bloodType")}>
            <option value="">—</option>
            {BLOOD_TYPES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>
            {TEXT.allergies} <small>({TEXT.oneItemPerLine})</small>
          </span>
          <textarea rows={2} value={form.allergies} onChange={set("allergies")} />
        </label>
        <label>
          <span>
            {TEXT.conditions} <small>({TEXT.oneItemPerLine})</small>
          </span>
          <textarea rows={2} value={form.conditions} onChange={set("conditions")} />
        </label>
        <label>
          <span>
            {TEXT.medications} <small>({TEXT.medicationsHint})</small>
          </span>
          <textarea rows={3} value={form.medications} onChange={set("medications")} />
        </label>
        <p className="login-note account-note">{TEXT.medicalWhy}</p>

        {message && <p className={message.ok ? "login-notice" : "login-error"}>{message.text}</p>}

        <button type="submit" className="btn-primary" disabled={saving || !changed}>
          {saving ? TEXT.profileSaving : TEXT.profileSave}
        </button>
      </form>
    </>
  );
}
