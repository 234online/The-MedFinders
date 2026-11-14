/**
 * favorites table: clinics a user saved. place_id = the clinic code
 * used by the website (e.g. 'medlife-spital').
 */

const db = require('../db/pool');

async function list(userId) {
  const { rows } = await db.query(
    'SELECT place_id FROM favorites WHERE user_id = $1 ORDER BY created_at',
    [userId]
  );
  return rows.map((r) => r.place_id);
}

async function add(userId, placeIds) {
  if (placeIds.length === 0) return;
  await db.query(
    `INSERT INTO favorites (user_id, place_id)
     SELECT $1, unnest($2::varchar[])
     ON CONFLICT DO NOTHING`,
    [userId, placeIds]
  );
}

async function remove(userId, placeId) {
  await db.query('DELETE FROM favorites WHERE user_id = $1 AND place_id = $2', [userId, placeId]);
}

// For the statistics page: how many people saved each clinic since `from`.
// Only totals per clinic, never who saved them.
async function countsSince(from) {
  const { rows } = await db.query(
    `SELECT place_id, count(*)::int AS n FROM favorites
     WHERE created_at >= $1 GROUP BY place_id`,
    [from]
  );
  return Object.fromEntries(rows.map((r) => [r.place_id, r.n]));
}

module.exports = { list, add, remove, countsSince };
