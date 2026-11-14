import { useEffect, useState } from "react";
import { apiFetch } from "../account/api.js";
import { SERVER_ACCOUNT } from "../account/useAccount.js";
import { MOCK_DOCTOR, MOCK_APPOINTMENTS, mockPatient } from "./mockData.js";

// =============================================================
//  DOCTOR DASHBOARD <-> BACKEND
//  Until the backend has these endpoints, the dashboard shows the
//  demo data from mockData.js. To use the real backend, set
//      VITE_DOCTOR_API=true
//  in frontend/.env (Auth0 + VITE_API_URL must be set up too).
//
//  Endpoints the backend should add (routes/doctor.js, protected
//  with requireRole('doctor'), see backend/middleware/auth.js):
//    GET /api/doctor/me              { id, name, specialty, clinic: { id, name } }
//    GET /api/doctor/appointments    [{ id, date: "YYYY-MM-DD", time: "HH:MM", reason,
//                                       status, patient: { id, name, birthDate, sex, allergies } }]
//    GET /api/doctor/patients/:id    { id, name, birthDate, sex, phone, email, bloodType,
//                                      allergies[], conditions[], medications[{ name, dose }],
//                                      visits[{ date, clinic, doctor, reason, diagnosis, notes }] }
//  A doctor should only get patients with an appointment at their clinic.
// =============================================================

export const DOCTOR_API = SERVER_ACCOUNT && import.meta.env.VITE_DOCTOR_API === "true";

// Small pause so the demo shows loading states like the real thing would
const demo = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 250));

export const doctorApi = {
  getProfile: () => (DOCTOR_API ? apiFetch("/api/doctor/me") : demo(MOCK_DOCTOR)),
  getAppointments: () => (DOCTOR_API ? apiFetch("/api/doctor/appointments") : demo(MOCK_APPOINTMENTS)),
  getPatient: (id) =>
    DOCTOR_API ? apiFetch(`/api/doctor/patients/${encodeURIComponent(id)}`) : demo(mockPatient(id)),
};

// Loads something once (and again when `key` changes).
// Returns { data, loading, error } where error.status is 401/403 for login/role problems.
export function useDoctorData(load, key) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let alive = true;
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
