import { useEffect, useState } from "react";
import { adminApi } from "../account/api.js";
import { refreshBookingClinics } from "../account/useBookingClinics.js";
import { TEXT } from "../config/texts.js";
import "./panels.css";

// =============================================================
//  Admins: doctor account requests waiting for approval.
//  Approving makes the person a doctor at the requested clinics
//  (in Auth0 and in the database); they log out and in again to
//  see the doctor portal.
// =============================================================

export default function AdminDoctorRequests() {
  const [requests, setRequests] = useState(null);
  const [busy, setBusy] = useState(null); // id being handled
  const [message, setMessage] = useState(null); // { ok, text }

  const load = () =>
    adminApi
      .listDoctorRequests("pending")
      .then(setRequests)
      .catch(() => setRequests([]));

  useEffect(() => {
    load();
  }, []);

  async function decide(request, approve) {
    let note = null;
    if (!approve) {
      note = window.prompt(TEXT.adminRejectReason, "");
      if (note === null) return; // cancelled
    }
    setBusy(request.id);
    setMessage(null);
    try {
      const result = approve ? await adminApi.approve(request.id) : await adminApi.reject(request.id, note);
      setMessage({
        ok: !result.warning,
        text: result.warning ?? (approve ? TEXT.adminApproved(request.user.name) : TEXT.adminRejected(request.user.name)),
      });
      if (approve) refreshBookingClinics();
      await load();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setBusy(null);
    }
  }

  if (requests === null) return null;

  return (
    <section className="admin-requests">
      <h3>
        {TEXT.adminRequestsTitle} ({requests.length})
      </h3>
      {message && <p className={message.ok ? "login-notice" : "login-error"}>{message.text}</p>}
      {requests.length === 0 ? (
        <p className="saved-empty">{TEXT.adminRequestsEmpty}</p>
      ) : (
        <ul className="saved-list admin-request-list">
          {requests.map((r) => (
            <li key={r.id}>
              <div>
                <strong>{r.user.name || r.user.email}</strong>
                <small>{r.user.email}</small>
                <small>
                  {r.specialty} · {TEXT.doctorRequestLicense}: {r.licenseNumber}
                </small>
                <small>{r.clinics.map((c) => c.name).join(", ")}</small>
                {r.message && <small className="admin-request-message">“{r.message}”</small>}
              </div>
              <div className="admin-request-actions">
                <button type="button" className="btn-primary" disabled={busy === r.id} onClick={() => decide(r, true)}>
                  {TEXT.adminApprove}
                </button>
                <button type="button" className="btn-secondary" disabled={busy === r.id} onClick={() => decide(r, false)}>
                  {TEXT.adminReject}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="login-note account-note">{TEXT.adminRequestsHint}</p>
    </section>
  );
}
