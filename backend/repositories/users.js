/**
 * users table: one row per Auth0 account.
 * Auth0 stores the login (email + password, Google); this table stores
 * everything the site needs about the person (profile, role, ...), keyed
 * by the Auth0 id ("sub"). Other tables point to users.id.
 */

const db = require('../db/pool');

// Columns returned to the app (never select * : new private columns stay private)
const PUBLIC_COLUMNS = `id, auth0_id, email, name, picture, role, phone,
  to_char(birth_date, 'YYYY-MM-DD') AS birth_date, sex, preferred_language, specialty,
  ARRAY(SELECT dc.place_id FROM doctor_clinics dc WHERE dc.doctor_id = users.id ORDER BY dc.place_id) AS clinic_ids,
  created_at, last_login, updated_at`;

const clean = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

const ROLES = ['patient', 'doctor', 'admin'];

/**
 * Called on every logged-in request. Creates the user the first time.
 * From Auth0: email (Auth0 is the source of truth) and picture are refreshed;
 * the name is only filled in once, so a name edited on the site is kept.
 *
 * `access` comes from the Auth0 access token (see middleware/auth.js and
 * backend/auth0/README.md): { role, clinicIds: [...], specialty }. Auth0 is
 * the source of truth for roles, so when the token carries a role it is
 * copied here together with the doctor's clinics; without one (Action not
 * set up yet) the role and clinics in the database are kept.
 */
async function upsertFromAuth0(auth0Id, profile = {}, access = null) {
  const role = ROLES.includes(access?.role) ? access.role : null;
  const { rows } = await db.query(
    `INSERT INTO users (auth0_id, email, name, picture, role, specialty)
     VALUES ($1, $2, $3, $4, COALESCE($5::varchar, 'patient'), $6)
     ON CONFLICT (auth0_id) DO UPDATE SET
       email      = COALESCE(EXCLUDED.email,   users.email),
       name       = COALESCE(users.name,       EXCLUDED.name),
       picture    = COALESCE(EXCLUDED.picture, users.picture),
       role       = COALESCE($5, users.role),
       specialty  = CASE WHEN $5 IS NULL THEN users.specialty ELSE $6 END,
       last_login = now()
     RETURNING ${PUBLIC_COLUMNS}`,
    [
      auth0Id,
      clean(profile.email, 254),
      clean(profile.name, 200),
      clean(profile.picture, 2000),
      role,
      role === 'doctor' ? clean(access.specialty, 120) : null
    ]
  );
  const user = rows[0];
  if (role) user.clinic_ids = await setClinics(user.id, role === 'doctor' ? access.clinicIds : []);
  return user;
}

// Clinic codes like 'medlife-spital': valid, no duplicates, at most 50
function cleanClinicIds(list) {
  if (!Array.isArray(list)) return [];
  const ok = list.filter((v) => typeof v === 'string' && /^[a-z0-9][a-z0-9_-]{0,79}$/i.test(v));
  return [...new Set(ok)].slice(0, 50).sort();
}

// Makes doctor_clinics match the list (one round trip; nothing changes if equal)
async function setClinics(userId, clinicIds) {
  const ids = cleanClinicIds(clinicIds);
  await db.query(
    `WITH removed AS (
       DELETE FROM doctor_clinics WHERE doctor_id = $1 AND NOT (place_id = ANY($2::varchar[]))
     )
     INSERT INTO doctor_clinics (doctor_id, place_id)
     SELECT $1, unnest($2::varchar[])
     ON CONFLICT DO NOTHING`,
    [userId, ids]
  );
  return ids;
}

async function findByEmail(email) {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE lower(email) = lower($1) ORDER BY last_login DESC NULLS LAST`,
    [email]
  );
  return rows;
}

// Used by scripts/set_role.js (Auth0 stays the source of truth: the next
// login copies the role from Auth0 again)
async function setAccess(id, { role, clinicIds = [], specialty = null }) {
  const { rows } = await db.query(
    'UPDATE users SET role = $2, specialty = $3, updated_at = now() WHERE id = $1 RETURNING id',
    [id, role, role === 'doctor' ? specialty : null]
  );
  if (!rows[0]) return null;
  await setClinics(id, role === 'doctor' ? clinicIds : []);
  return findById(id);
}

// ---------- Doctors per clinic (for booking) ----------
// Approved doctors working at a clinic: only what a patient needs to choose
async function doctorsAtClinic(placeId) {
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.specialty
     FROM doctor_clinics dc JOIN users u ON u.id = dc.doctor_id
     WHERE dc.place_id = $1 AND u.role = 'doctor'
     ORDER BY u.name NULLS LAST, u.id`,
    [placeId]
  );
  return rows.map((r) => ({ id: r.id, name: r.name || 'Medic', specialty: r.specialty }));
}

// { 'medlife-spital': 2, ... }: clinics that take online appointments
async function doctorCountsByClinic() {
  const { rows } = await db.query(
    `SELECT dc.place_id, count(*)::int AS n
     FROM doctor_clinics dc JOIN users u ON u.id = dc.doctor_id
     WHERE u.role = 'doctor'
     GROUP BY dc.place_id`
  );
  return Object.fromEntries(rows.map((r) => [r.place_id, r.n]));
}

async function findById(id) {
  const { rows } = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

// Fields a user may change about themselves (role is NOT one of them)
const EDITABLE = ['name', 'phone', 'birth_date', 'sex', 'preferred_language'];

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

module.exports = {
  ROLES,
  EDITABLE,
  upsertFromAuth0,
  findById,
  findByEmail,
  doctorsAtClinic,
  doctorCountsByClinic,
  setAccess,
  setClinics,
  cleanClinicIds,
  updateProfile,
  remove
};
