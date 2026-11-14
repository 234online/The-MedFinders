/**
 * doctor_requests table: "I'm a doctor at clinic X" requests.
 * The person stays a patient until an admin approves (see routes/doctorRequests.js).
 */

const db = require('../db/pool');

const COLUMNS = `r.id, r.user_id, r.place_ids, r.specialty, r.license_number, r.message, r.status,
  r.review_note, r.reviewed_at, r.created_at`;

const toApi = (r) => ({
  id: r.id,
  userId: r.user_id,
  placeIds: r.place_ids,
  specialty: r.specialty,
  licenseNumber: r.license_number,
  message: r.message,
  status: r.status,
  reviewNote: r.review_note,
  reviewedAt: r.reviewed_at,
  createdAt: r.created_at,
  ...(r.user_name !== undefined && { user: { name: r.user_name, email: r.user_email } })
});

async function latestForUser(userId) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM doctor_requests r WHERE r.user_id = $1 ORDER BY r.created_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] ? toApi(rows[0]) : null;
}

// Returns null if the person already has a pending request
async function create({ userId, placeIds, specialty, licenseNumber, message }) {
  const { rows } = await db.query(
    `INSERT INTO doctor_requests AS r (user_id, place_ids, specialty, license_number, message)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) WHERE status = 'pending' DO NOTHING
     RETURNING ${COLUMNS}`,
    [userId, placeIds, specialty, licenseNumber, message]
  );
  return rows[0] ? toApi(rows[0]) : null;
}

async function list(status = 'pending') {
  const { rows } = await db.query(
    `SELECT ${COLUMNS}, u.name AS user_name, u.email AS user_email
     FROM doctor_requests r JOIN users u ON u.id = r.user_id
     WHERE r.status = $1
     ORDER BY r.created_at
     LIMIT 500`,
    [status]
  );
  return rows.map(toApi);
}

async function findById(id) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS}, u.name AS user_name, u.email AS user_email, u.auth0_id
     FROM doctor_requests r JOIN users u ON u.id = r.user_id WHERE r.id = $1`,
    [id]
  );
  return rows[0] ? { ...toApi(rows[0]), auth0Id: rows[0].auth0_id } : null;
}

// Only pending requests can be decided (stops double approvals)
async function decide(id, { status, reviewerId, note = null, placeIds = null, specialty = null }) {
  const { rows } = await db.query(
    `UPDATE doctor_requests r SET
       status = $2, reviewed_by = $3, review_note = $4, reviewed_at = now(),
       place_ids = COALESCE($5::varchar[], r.place_ids),
       specialty = COALESCE($6::varchar, r.specialty)
     WHERE r.id = $1 AND r.status = 'pending'
     RETURNING ${COLUMNS}`,
    [id, status, reviewerId, note, placeIds, specialty]
  );
  return rows[0] ? toApi(rows[0]) : null;
}

module.exports = { latestForUser, create, list, findById, decide };
