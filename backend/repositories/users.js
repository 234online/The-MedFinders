/**
 * users table: one row per Auth0 account.
 * Auth0 stores the login (email + password, Google); this table stores
 * everything the site needs about the person (profile, role, ...), keyed
 * by the Auth0 id ("sub"). Other tables point to users.id.
 */

const db = require('../db/pool');

// Columns returned to the app (never select * : new private columns stay private)
const PUBLIC_COLUMNS = `id, auth0_id, email, name, picture, role, phone,
  to_char(birth_date, 'YYYY-MM-DD') AS birth_date, preferred_language,
  created_at, last_login, updated_at`;

const clean = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

/**
 * Called on every logged-in request. Creates the user the first time.
 * From Auth0: email (Auth0 is the source of truth) and picture are refreshed;
 * the name is only filled in once, so a name edited on the site is kept.
 */
async function upsertFromAuth0(auth0Id, profile = {}) {
  const { rows } = await db.query(
    `INSERT INTO users (auth0_id, email, name, picture)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (auth0_id) DO UPDATE SET
       email      = COALESCE(EXCLUDED.email,   users.email),
       name       = COALESCE(users.name,       EXCLUDED.name),
       picture    = COALESCE(EXCLUDED.picture, users.picture),
       last_login = now()
     RETURNING ${PUBLIC_COLUMNS}`,
    [auth0Id, clean(profile.email, 254), clean(profile.name, 200), clean(profile.picture, 2000)]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

// Fields a user may change about themselves (role is NOT one of them)
const EDITABLE = ['name', 'phone', 'birth_date', 'preferred_language'];

async function updateProfile(id, changes) {
  const keys = EDITABLE.filter((k) => k in changes);
  if (keys.length === 0) return findById(id);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`);
  const { rows } = await db.query(
    `UPDATE users SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING ${PUBLIC_COLUMNS}`,
    [id, ...keys.map((k) => changes[k])]
  );
  return rows[0] || null;
}

// Deletes the user's data on this site (favourites go with it, contact
// history is kept anonymously). The Auth0 login itself is not deleted.
async function remove(id) {
  await db.query('DELETE FROM users WHERE id = $1', [id]);
}

module.exports = { EDITABLE, upsertFromAuth0, findById, updateProfile, remove };
