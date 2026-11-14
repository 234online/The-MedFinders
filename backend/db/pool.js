/**
 * One shared PostgreSQL connection pool (Render), from DATABASE_URL.
 * Without DATABASE_URL, user features (accounts, favourites, history)
 * are off and the clinics API keeps working.
 */

require('dotenv').config();
const { Pool } = require('pg');

function sslFor(url) {
  // Render's "External Database URL" needs SSL; a local Postgres usually doesn't.
  // DATABASE_SSL=true/false overrides the guess.
  if (process.env.DATABASE_SSL) return process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false;
  return /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false };
}

function createPool(url) {
  if (!url) return null;
  const pool = new Pool({ connectionString: url, ssl: sslFor(url) });
  // Render may close idle connections (maintenance, restarts). Without this
  // handler that error would crash the whole server; the pool reconnects by itself.
  pool.on('error', (err) => console.error('[PG] Conexiune pierdută:', err.message));
  return pool;
}

let pool = createPool(process.env.DATABASE_URL);

module.exports = {
  isEnabled: () => Boolean(pool),
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
  // Tests: point everything at another database
  usePool: (customPool) => {
    pool = customPool;
  },
  close: () => (pool ? pool.end() : Promise.resolve())
};
