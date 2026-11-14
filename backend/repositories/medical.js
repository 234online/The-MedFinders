/**
 * medical_profiles table: blood type, allergies, chronic conditions and
 * current medication, filled in by the patient on "My account".
 */

const db = require('../db/pool');

const EMPTY = { bloodType: null, allergies: [], conditions: [], medications: [] };

const toApi = (row) =>
  row
    ? { bloodType: row.blood_type, allergies: row.allergies, conditions: row.conditions, medications: row.medications }
    : { ...EMPTY };

async function get(userId) {
  const { rows } = await db.query(
    'SELECT blood_type, allergies, conditions, medications FROM medical_profiles WHERE user_id = $1',
    [userId]
  );
  return toApi(rows[0]);
}

// Replaces the whole medical profile (the form always sends every field)
async function save(userId, { bloodType, allergies, conditions, medications }) {
  const { rows } = await db.query(
    `INSERT INTO medical_profiles (user_id, blood_type, allergies, conditions, medications)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       blood_type = EXCLUDED.blood_type, allergies = EXCLUDED.allergies,
       conditions = EXCLUDED.conditions, medications = EXCLUDED.medications, updated_at = now()
     RETURNING blood_type, allergies, conditions, medications`,
    [userId, bloodType, allergies, conditions, JSON.stringify(medications)]
  );
  return toApi(rows[0]);
}

module.exports = { get, save };
