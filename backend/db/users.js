/**
 * PostgreSQL (Render): users, favourite clinics and contact history.
 * Connection comes from DATABASE_URL. Without it these features are off
 * and the rest of the API (clinics) keeps working.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const CONTACT_KINDS = ['call', 'whatsapp', 'email'];

function sslFor(url) {
  // Render's "External Database URL" needs SSL; a local Postgres usually doesn't.
  // DATABASE_SSL=true/false overrides the guess.
  if (process.env.DATABASE_SSL) return process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false;
  return /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false };
}

let pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL, ssl: sslFor(DATABASE_URL) }) : null;

// Render may close idle connections (maintenance, restarts). Without this
// handler that error would crash the whole server; the pool reconnects by itself.
if (pool) pool.on('error', (err) => console.error('[PG] Conexiune pierdută:', err.message));

const isEnabled = () => Boolean(pool);

// For tests: use another pg-compatible pool
function setPool(customPool) {
  pool = customPool;
}

async function init() {
  if (!pool) return false;
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await pool.query(schema);
  return true;
}

// Creates the user on first login, updates name/email/picture afterwards.
// Profile fields are optional: the access token only guarantees auth0Id.
async function upsertUser(auth0Id, profile = {}) {
  const clean = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  const { rows } = await pool.query(
    `INSERT INTO users (auth0_id, email, name, picture)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (auth0_id) DO UPDATE SET
       email      = COALESCE(EXCLUDED.email,   users.email),
       name       = COALESCE(EXCLUDED.name,    users.name),
       picture    = COALESCE(EXCLUDED.picture, users.picture),
       last_login = now()
     RETURNING user_id, auth0_id, email, name, picture, created_at, last_login`,
    [auth0Id, clean(profile.email, 254), clean(profile.name, 200), clean(profile.picture, 2000)]
  );
  return rows[0];
}

async function getFavorites(userId) {
  const { rows } = await pool.query(
    'SELECT place_id FROM favorites WHERE user_id = $1 ORDER BY created_at',
    [userId]
  );
  return rows.map((r) => r.place_id);
}

async function addFavorites(userId, placeIds) {
  if (placeIds.length === 0) return;
  await pool.query(
    `INSERT INTO favorites (user_id, place_id)
     SELECT $1, unnest($2::int[])
     ON CONFLICT DO NOTHING`,
    [userId, placeIds]
  );
}

async function removeFavorite(userId, placeId) {
  await pool.query('DELETE FROM favorites WHERE user_id = $1 AND place_id = $2', [userId, placeId]);
}

async function addContactEvent({ userId = null, placeId, kind, target = null }) {
  const { rows } = await pool.query(
    `INSERT INTO contact_events (user_id, place_id, kind, target)
     VALUES ($1, $2, $3, $4)
     RETURNING event_id, place_id, kind, target, created_at`,
    [userId, placeId, kind, target ? String(target).slice(0, 254) : null]
  );
  return rows[0];
}

async function getContactEvents(userId, limit = 50) {
  const { rows } = await pool.query(
    `SELECT event_id, place_id, kind, target, created_at
     FROM contact_events WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

async function ping() {
  if (!pool) return false;
  await pool.query('SELECT 1');
  return true;
}

module.exports = {
  CONTACT_KINDS,
  isEnabled,
  setPool,
  init,
  ping,
  upsertUser,
  getFavorites,
  addFavorites,
  removeFavorite,
  addContactEvent,
  getContactEvents
};
