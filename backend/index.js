/**
 * Starts the backend: loads the clinics, brings the PostgreSQL database
 * up to date (db/migrations), then listens for requests.
 * The app itself (routes, login checks) is in app.js.
 */

const config = require('./config');
const db = require('./db/pool');
const places = require('./db/database');
const { migrate } = require('./db/migrate');
const { createApp } = require('./app');

async function start() {
  try {
    console.log(`[DB] ${(await places.loadPlaces()).length} locații încărcate`);
  } catch (err) {
    console.error('[DB] Eroare la încărcarea clinicilor:', err.message);
  }

  if (db.isEnabled()) {
    try {
      await migrate();
      console.log('[PG] Conectat la PostgreSQL, baza de date este la zi');
    } catch (err) {
      console.error('[PG] Problemă cu PostgreSQL:', err.message);
    }
  } else {
    console.warn('[PG] DATABASE_URL lipsește: conturile, favoritele și istoricul sunt dezactivate');
  }

  if (!config.authConfig) {
    console.warn('[Auth0] AUTH0_DOMAIN / AUTH0_AUDIENCE lipsesc: rutele cu login răspund 503');
  }

  createApp().listen(config.port, () => {
    console.log(`[API] Server pornit pe portul ${config.port}`);
    console.log(`[API] CORS permis pentru: ${config.frontendUrls.join(', ')}`);
  });
}

if (require.main === module) start();

module.exports = { createApp };
