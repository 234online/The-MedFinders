/**
 * appointments table: appointment requests patients send from a clinic's
 * page (preferred day + time + reason).
 *   Patient side: send, list, cancel their own.
 *   Doctor side:  every doctor of the clinic sees the request; a doctor can
 *                 accept (confirm) / decline (cancel) / complete it, and read
 *                 the visit history of those patients. A doctor can work at
 *                 several clinics: the functions take a list of clinic codes.
 */

const db = require('../db/pool');

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
const MAX_OPEN_PER_PATIENT = 10;

const COLUMNS = `a.id, a.place_id, to_char(a.day, 'YYYY-MM-DD') AS date, to_char(a.time, 'HH24:MI') AS time,
  a.reason, a.status, a.diagnosis, a.notes, a.created_at, a.requested_doctor_id,
  (SELECT rd.name FROM users rd WHERE rd.id = a.requested_doctor_id) AS requested_doctor_name`;

const toApi = (r) => ({
  id: r.id,
  placeId: r.place_id,
  date: r.date,
  time: r.time,
  reason: r.reason,
  status: r.status,
  diagnosis: r.diagnosis,
  notes: r.notes,
  createdAt: r.created_at,
  // The doctor the patient chose, or null = any doctor of the clinic
  requestedDoctor: r.requested_doctor_id ? { id: r.requested_doctor_id, name: r.requested_doctor_name } : null
});

// A doctor sees the clinic's requests addressed to "any doctor" or to them.
// $N is the doctor's id; used by every doctor query below.
const VISIBLE_TO_DOCTOR = (n) => `(a.requested_doctor_id IS NULL OR a.requested_doctor_id = $${n})`;

// ---------- Patient ----------
async function countOpen(patientId) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS n FROM appointments
     WHERE patient_id = $1 AND status IN ('pending', 'confirmed') AND day >= CURRENT_DATE`,
    [patientId]
  );
  return rows[0].n;
}

async function create({ patientId, placeId, date, time, reason, doctorId = null }) {
  const { rows } = await db.query(
    `INSERT INTO appointments AS a (patient_id, place_id, day, time, reason, requested_doctor_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNS}`,
    [patientId, placeId, date, time, reason, doctorId]
  );
  return toApi(rows[0]);
}

async function listForPatient(patientId) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM appointments a WHERE a.patient_id = $1 ORDER BY a.day DESC, a.time DESC LIMIT 100`,
    [patientId]
  );
  return rows.map(toApi);
}

// Only upcoming, not yet completed appointments can be cancelled
async function cancelByPatient(id, patientId) {
  const { rows } = await db.query(
    `UPDATE appointments a SET status = 'cancelled', updated_at = now()
     WHERE a.id = $1 AND a.patient_id = $2 AND a.status IN ('pending', 'confirmed') AND a.day >= CURRENT_DATE
     RETURNING ${COLUMNS}`,
    [id, patientId]
  );
  return rows[0] ? toApi(rows[0]) : null;
}

// ---------- Doctor ----------
// Every appointment at the doctor's clinics, with the short patient card
// (name, age, sex, allergies) taken from the patient's own account, and
// which doctor handled it (several doctors share a clinic's requests).
async function listForClinics(placeIds, doctorId) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS}, u.id AS patient_id, u.name AS patient_name,
            to_char(u.birth_date, 'YYYY-MM-DD') AS patient_birth_date, u.sex AS patient_sex,
            COALESCE(m.allergies, '{}') AS patient_allergies, d.name AS handled_by
     FROM appointments a
     JOIN users u ON u.id = a.patient_id
     LEFT JOIN medical_profiles m ON m.user_id = u.id
     LEFT JOIN users d ON d.id = a.doctor_id
     WHERE a.place_id = ANY($1::varchar[]) AND ${VISIBLE_TO_DOCTOR(2)}
       AND a.day >= CURRENT_DATE - INTERVAL '180 days'
     ORDER BY a.day, a.time
     LIMIT 2000`,
    [placeIds, doctorId]
  );
  return rows.map((r) => ({
    ...toApi(r),
    handledBy: r.handled_by,
    patient: {
      id: r.patient_id,
      name: r.patient_name || '—',
      birthDate: r.patient_birth_date,
      sex: r.patient_sex,
      allergies: r.patient_allergies
    }
  }));
}

async function patientHasClinicAppointment(patientId, placeIds, doctorId) {
  const { rowCount } = await db.query(
    `SELECT 1 FROM appointments a
     WHERE a.patient_id = $1 AND a.place_id = ANY($2::varchar[]) AND ${VISIBLE_TO_DOCTOR(3)} LIMIT 1`,
    [patientId, placeIds, doctorId]
  );
  return rowCount > 0;
}

// The doctor changes the status and can write a diagnosis / notes
// (only for appointments at one of the doctor's clinics)
async function updateByDoctor(id, { placeIds, doctorId, status, diagnosis, notes }) {
  const { rows } = await db.query(
    `UPDATE appointments a SET
       status    = COALESCE($3::varchar, a.status),
       diagnosis = CASE WHEN $4::boolean THEN $5::varchar ELSE a.diagnosis END,
       notes     = CASE WHEN $6::boolean THEN $7::text ELSE a.notes END,
       doctor_id = $8,
       updated_at = now()
     WHERE a.id = $1 AND a.place_id = ANY($2::varchar[]) AND ${VISIBLE_TO_DOCTOR(8)}
     RETURNING ${COLUMNS}`,
    [id, placeIds, status ?? null, diagnosis !== undefined, diagnosis ?? null, notes !== undefined, notes ?? null, doctorId]
  );
  return rows[0] ? toApi(rows[0]) : null;
}

// Completed appointments at any clinic = the patient's visit history
async function historyForPatient(patientId) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS}, d.name AS doctor_name
     FROM appointments a LEFT JOIN users d ON d.id = a.doctor_id
     WHERE a.patient_id = $1 AND a.status = 'completed'
     ORDER BY a.day DESC, a.time DESC LIMIT 100`,
    [patientId]
  );
  return rows.map((r) => ({ ...toApi(r), doctor: r.doctor_name }));
}

module.exports = {
  STATUSES,
  MAX_OPEN_PER_PATIENT,
  countOpen,
  create,
  listForPatient,
  cancelByPatient,
  listForClinics,
  patientHasClinicAppointment,
  updateByDoctor,
  historyForPatient
};
