/**
 * contact_events table: every Call / WhatsApp / Email click on a clinic.
 * user_id is empty for visitors who were not logged in.
 */

const db = require('../db/pool');

const KINDS = ['call', 'whatsapp', 'email'];

async function add({ userId = null, placeId, kind, target = null }) {
  const { rows } = await db.query(
    `INSERT INTO contact_events (user_id, place_id, kind, target)
     VALUES ($1, $2, $3, $4)
     RETURNING event_id, place_id, kind, target, created_at`,
    [userId, placeId, kind, target ? String(target).slice(0, 254) : null]
  );
  return rows[0];
}

async function listForUser(userId, limit = 50) {
  const { rows } = await db.query(
    `SELECT event_id, place_id, kind, target, created_at
     FROM contact_events WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

module.exports = { KINDS, add, listForUser };
