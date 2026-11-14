// =============================================================
//  DEMO DATA for the doctor dashboard (used until the backend
//  endpoints exist, see doctorApi.js). Every person here is made up.
//  The shapes below are what the backend should return.
// =============================================================

import MOCK_DOCUMENTS from "./mockDocuments.json";

// "YYYY-MM-DD" for today + n days (so "today" always has appointments)
function day(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// GET /api/doctor/me (a doctor can work at several clinics)
export const MOCK_DOCTOR = {
  id: 1,
  name: "Dr. Ana Popescu",
  specialty: "Cardiologie",
  clinics: [
    { id: "medlife-spital", name: "Spitalul MedLife Medici's (Ambulatoriu)" },
    { id: "medlife-eroilor", name: "Hyperclinica MedLife Timișoara – Eroilor" },
  ],
};

// Medical history per patient (GET /api/doctor/patients/:id)
const PATIENTS = {
  p1: {
    id: "p1",
    name: "Ion Ionescu",
    birthDate: "1961-03-14",
    sex: "M",
    phone: "0722 000 101",
    email: "ion.ionescu@example.com",
    bloodType: "A+",
    allergies: ["Penicilină"],
    conditions: ["Hipertensiune arterială", "Diabet zaharat tip 2"],
    medications: [
      { name: "Metformin", dose: "1000 mg, de 2 ori pe zi" },
      { name: "Perindopril", dose: "5 mg, dimineața" },
    ],
    visits: [
      { date: day(-120), clinic: "Clinica Demo Timișoara", doctor: "Dr. Ana Popescu", reason: "Control cardiologic", diagnosis: "HTA grad II, controlată", notes: "EKG normal. Se continuă tratamentul." },
      { date: day(-300), clinic: "Laborator Demo", doctor: "—", reason: "Analize de sânge", diagnosis: "HbA1c 7,1%", notes: "Glicemie ușor crescută." },
    ],
  },
  p2: {
    id: "p2",
    name: "Maria Georgescu",
    birthDate: "1988-07-02",
    sex: "F",
    phone: "0733 000 202",
    email: "maria.g@example.com",
    bloodType: "0+",
    allergies: [],
    conditions: [],
    medications: [],
    visits: [],
  },
  p3: {
    id: "p3",
    name: "Andrei Popa",
    birthDate: "1975-11-23",
    sex: "M",
    phone: "0744 000 303",
    email: "andrei.popa@example.com",
    bloodType: "B-",
    allergies: ["Aspirină", "Polen"],
    conditions: ["Fibrilație atrială"],
    medications: [
      { name: "Apixaban", dose: "5 mg, de 2 ori pe zi" },
      { name: "Bisoprolol", dose: "2,5 mg, dimineața" },
    ],
    visits: [
      { date: day(-45), clinic: "Clinica Demo Timișoara", doctor: "Dr. Ana Popescu", reason: "Palpitații", diagnosis: "Fibrilație atrială paroxistică", notes: "Holter 24h recomandat. Început anticoagulant." },
      { date: day(-400), clinic: "Spital Demo", doctor: "Dr. Mihai Stan", reason: "Urgență – amețeli", diagnosis: "Lipotimie", notes: "Externat după 24h, fără complicații." },
    ],
  },
  p4: {
    id: "p4",
    name: "Elena Dumitrescu",
    birthDate: "1953-01-30",
    sex: "F",
    phone: "0755 000 404",
    email: null,
    bloodType: "AB+",
    allergies: ["Iod (substanță de contrast)"],
    conditions: ["Insuficiență cardiacă", "Osteoporoză"],
    medications: [
      { name: "Furosemid", dose: "40 mg, dimineața" },
      { name: "Sacubitril/Valsartan", dose: "49/51 mg, de 2 ori pe zi" },
    ],
    visits: [
      { date: day(-30), clinic: "Clinica Demo Timișoara", doctor: "Dr. Ana Popescu", reason: "Control", diagnosis: "IC clasa NYHA II", notes: "Edeme reduse. Ecografie peste 3 luni." },
    ],
  },
  p5: {
    id: "p5",
    name: "Radu Constantin",
    birthDate: "1995-05-09",
    sex: "M",
    phone: "0766 000 505",
    email: "radu.c@example.com",
    bloodType: "A-",
    allergies: [],
    conditions: ["Astm bronșic"],
    medications: [{ name: "Salbutamol inhalator", dose: "la nevoie" }],
    visits: [
      { date: day(-200), clinic: "Policlinica Demo", doctor: "Dr. Ioana Vlad", reason: "Dificultăți de respirație", diagnosis: "Astm bronșic ușor", notes: "Spirometrie efectuată." },
    ],
  },
  p6: {
    id: "p6",
    name: "Ioana Marin",
    birthDate: "2001-09-17",
    sex: "F",
    phone: "0777 000 606",
    email: "ioana.marin@example.com",
    bloodType: "0-",
    allergies: ["Lactoză"],
    conditions: [],
    medications: [],
    visits: [],
  },
};

// GET /api/doctor/appointments: requests + appointments at all the doctor's clinics
// status: "pending" (new request) | "confirmed" | "completed" | "cancelled"
// handledBy: the doctor of the clinic who accepted / handled it
const S = "medlife-spital";
const E = "medlife-eroilor";
export const MOCK_APPOINTMENTS = [
  { id: "a1", placeId: S, patientId: "p1", date: day(0), time: "09:00", reason: "Control cardiologic periodic", status: "confirmed", handledBy: "Dr. Ana Popescu" },
  { id: "a2", placeId: E, patientId: "p3", date: day(0), time: "10:30", reason: "Rezultate Holter", status: "confirmed", handledBy: "Dr. Mihai Stan" },
  { id: "a3", placeId: S, patientId: "p2", date: day(0), time: "12:00", reason: "Dureri în piept la efort", status: "pending" },
  { id: "a4", placeId: S, patientId: "p4", date: day(1), time: "08:30", reason: "Control insuficiență cardiacă", status: "confirmed", handledBy: "Dr. Ana Popescu" },
  { id: "a5", placeId: E, patientId: "p6", date: day(2), time: "14:00", reason: "Palpitații de câteva zile", status: "pending" },
  { id: "a6", placeId: E, patientId: "p5", date: day(4), time: "11:15", reason: "Aviz medical sport", status: "pending" },
  { id: "a7", placeId: S, patientId: "p1", date: day(-7), time: "09:30", reason: "Analize + EKG", status: "completed", handledBy: "Dr. Ana Popescu" },
  { id: "a8", placeId: E, patientId: "p5", date: day(-3), time: "16:00", reason: "Consultație", status: "cancelled" },
].map((a) => ({ ...a, patient: summary(PATIENTS[a.patientId]) }));

// The short version of a patient shown in the appointment list
function summary(p) {
  return { id: p.id, name: p.name, birthDate: p.birthDate, sex: p.sex, allergies: p.allergies };
}

// Placeholder documents (files in public/demo-documents, made by
// backend/scripts/demo_documents.js; run it again after changing them)
const documentsOf = (id) => (MOCK_DOCUMENTS[id] ?? []).map(({ dayOffset, ...d }) => ({ ...d, date: day(dayOffset) }));

export function mockPatient(id) {
  return PATIENTS[id] ? { ...PATIENTS[id], documents: documentsOf(id) } : null;
}

// The file of one of those documents, as a Blob
export async function mockDocumentFile(patientId, docId) {
  const doc = (MOCK_DOCUMENTS[patientId] ?? []).find((d) => d.id === docId);
  if (!doc) throw new Error("Document not found");
  const response = await fetch(`${import.meta.env.BASE_URL}demo-documents/${doc.fileName}`);
  if (!response.ok) throw new Error(`Demo document: ${response.status}`);
  return response.blob();
}
