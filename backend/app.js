/**
 * The Express application: middleware + all route modules.
 * index.js starts it; tests build it with createApp({ authConfig }).
 *
 * To add a feature (e.g. appointments):
 *   1. db/migrations/003_appointments.sql     the table
 *   2. repositories/appointments.js           the SQL queries
 *   3. routes/appointments.js                 the endpoints (use requireUser)
 *   4. one line below:  app.use(require('./routes/appointments')(auth));
 */

const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./db/pool');
const { createAuth } = require('./middleware/auth');

function createApp(options = {}) {
  const app = express();
  const authConfig = options.authConfig !== undefined ? options.authConfig : config.authConfig;
  const auth = createAuth({ authConfig, adminKey: config.adminApiKey });

  app.set('trust proxy', 1); // Render runs behind a proxy
  app.use(cors({ origin: config.frontendUrls }));
  app.use(express.json({ limit: '100kb' }));

  if (!options.quiet) {
    app.use((req, _res, next) => {
      console.log(`[API] ${req.method} ${req.originalUrl}`);
      next();
    });
  }

  app.get('/api/health', async (_req, res) => {
    let database = 'not configured';
    if (db.isEnabled()) {
      database = await db.query('SELECT 1').then(() => 'ok', () => 'error');
    }
    res.json({ status: 'ok', database, auth0: authConfig ? 'configured' : 'not configured', time: new Date().toISOString() });
  });

  // ---------- Feature modules ----------
  app.use(require('./routes/booking')(auth));
  app.use(require('./routes/places')(auth));
  app.use(require('./routes/documents')(auth)); // before account: both guard /api/me
  app.use(require('./routes/account')(auth));
  app.use(require('./routes/doctor')(auth));
  app.use(require('./routes/contacts')(auth));
  app.use(require('./routes/analytics')(auth));

  // ---------- 404 and errors ----------
  app.use((req, res) => {
    res.status(404).json({ error: `Ruta ${req.method} ${req.originalUrl} nu există` });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalid în corpul cererii' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Fișierul sau cererea este prea mare' });
    // Auth0: token missing / expired / invalid
    if (err.status === 401 || err.status === 403 || err.name === 'UnauthorizedError' || err.name === 'InvalidTokenError') {
      return res.status(err.status || 401).json({ error: 'Trebuie să fii autentificat', detail: err.message });
    }
    console.error('[API] Eroare:', err);
    res.status(500).json({ error: 'Eroare internă a serverului' });
  });

  return app;
}

module.exports = { createApp };
