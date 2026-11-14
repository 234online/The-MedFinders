import { useEffect, useState } from "react";
import { apiBlob, apiFetch } from "../account/api.js";
import { SERVER_ACCOUNT } from "../account/useAccount.js";
import { MOCK_DOCTOR, MOCK_APPOINTMENTS, mockPatient, mockDocumentFile } from "./mockData.js";

// =============================================================
//  DOCTOR DASHBOARD <-> BACKEND (backend/routes/doctor.js)
//  With Auth0 + the backend set up (SERVER_ACCOUNT), the dashboard shows
//  real patients: those who booked at the doctor's clinic, with the data
//  from their own accounts. Without it (prototype), the demo data from
//  mockData.js.
//
//  Endpoints (only for role = 'doctor', see backend/auth0/README.md):
//    GET /api/doctor/me              { id, name, specialty, clinics: [{ id, name }] }
//    GET /api/doctor/appointments    [{ id, placeId, date: "YYYY-MM-DD", time: "HH:MM", reason,
//                                       status, handledBy, patient: { id, name, birthDate, sex, allergies } }]
//                                    requests sent to ANY of the doctor's clinics: every
//                                    doctor of a clinic sees the same requests
//    GET /api/doctor/patients/:id    { id, name, birthDate, sex, phone, email, bloodType,
//                                      allergies[], conditions[], medications[{ name, dose }],
//                                      visits[{ date, clinic, doctor, reason, diagnosis, notes }],
//                                      documents[{ id, category, title, fileName, mimeType, size, date }] }
//    GET /api/doctor/patients/:id/documents/:docId/file   one of the patient's uploaded files
//    PATCH /api/doctor/appointments/:id  { status?, diagnosis?, notes? }
//  A doctor only gets patients who sent a request to one of their clinics.
// =============================================================

export const DOCTOR_API = SERVER_ACCOUNT;

// Small pause so the demo shows loading states like the real thing would
const demo = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 250));

export const doctorApi = {
  getProfile: () => (DOCTOR_API ? apiFetch("/api/doctor/me") : demo(MOCK_DOCTOR)),
  getAppointments: () => (DOCTOR_API ? apiFetch("/api/doctor/appointments") : demo(MOCK_APPOINTMENTS)),
  getPatient: (id) =>
    DOCTOR_API ? apiFetch(`/api/doctor/patients/${encodeURIComponent(id)}`) : demo(mockPatient(id)),
  getPatientDocumentFile: (patientId, docId) =>
    DOCTOR_API
      ? apiBlob(`/api/doctor/patients/${encodeURIComponent(patientId)}/documents/${docId}/file`)
      : mockDocumentFile(patientId, docId),
  // Demo: nothing is saved, the dashboard just updates its own copy
  updateAppointment: (id, changes) =>
    DOCTOR_API ? apiFetch(`/api/doctor/appointments/${id}`, { method: "PATCH", body: changes }) : demo(changes),
};

// Loads something once (and again when `key` changes); key null = don't load.
// Returns { data, loading, error } where error.status is 401/403 for login/role problems.
export function useDoctorData(load, key) {
  const [state, setState] = useState({ data: null, loading: key != null, error: null });
  useEffect(() => {
    let alive = true;
    if (key == null) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState({ data: null, loading: true, error: null });
    load().then(
      (data) => alive && setState({ data, loading: false, error: null }),
      (error) => alive && setState({ data: null, loading: false, error })
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}
