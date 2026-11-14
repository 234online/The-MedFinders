/**
 * Database migrations.
 * Every file in db/migrations runs ONCE, in name order (001_, 002_, ...),
 * and is then recorded in the schema_migrations table.
 *
 * To change the database (new table for appointments, new column, ...):
 * add a new file, e.g. 003_appointments.sql. Never edit a file that has
 * already run on Render: write a new one instead.
 *
 * Runs on every server start; also by hand with:  npm run migrate
 */

const fs = require('fs');
const path = require('path');
const db = require('./pool');

const DIR = path.join(__dirname, 'migrations');
const LOCK_ID = 727274; // any fixed number: stops two server instances migrating at once

async function migrate({ log = console.log } = {}) {
  const client = await db.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name       VARCHAR(200) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const done = new Set(rows.map((r) => r.name));
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
    const applied = [];

    for (const file of files) {
      if (done.has(file)) continue;
      const sql = fs.readFileSync(path.join(DIR, file), 'utf-8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migrarea ${file} a eșuat: ${err.message}`);
      }
      applied.push(file);
      log(`[PG] Migrare aplicată: ${file}`);
    }
    return applied;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    client.release();
  }
}

if (require.main === module) {
  migrate()
    .then((applied) => console.log(applied.length ? 'Gata.' : 'Baza de date este deja la zi.'))
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 1;
    })
    .finally(() => db.close());
}

module.exports = { migrate };
