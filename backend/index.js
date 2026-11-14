require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { auth } = require('express-oauth2-jwt-bearer');
const db = require('./db/database');
const users = require('./db/users');
const analytics = require('./db/analytics');

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Auth0 API settings (Auth0 Dashboard -> Applications -> APIs)
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;     // ex: your-tenant.eu.auth0.com
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE; // ex: https://api.medfinders.ro
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;   // protejează rutele care modifică clinicile

// Împachetează rutele async ca erorile să ajungă la handler-ul de erori
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const toPlaceId = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// The website identifies clinics by their code ("medlife-spital"), the
// PostgreSQL tables by the numeric id from places.json. Accepts either and
// returns both: { id, code }, or null if the clinic doesn't exist.
async function resolvePlace(value) {
  const places = await db.loadPlaces();
  const id = toPlaceId(value);
  const place = id ? places.find((p) => p.id === id) : places.find((p) => p.code === value);
  return place ? { id: place.id, code: place.code } : null;
}

/**
 * Construiește aplicația. `options.authConfig` permite testelor să folosească
 * alte setări pentru verificarea token-urilor (în producție vin din .env).
 */
function createApp(options = {}) {
  const app = express();

  const authConfig =
    options.authConfig ||
    (AUTH0_DOMAIN && AUTH0_AUDIENCE
      ? { issuerBaseURL: `https://${AUTH0_DOMAIN}/`, audience: AUTH0_AUDIENCE }
      : null);

  // ------------------------------------------------------------------
  // Middleware-uri (trebuie să fie înaintea rutelor!)
  // ------------------------------------------------------------------
  // Render rulează în spatele unui proxy
  app.set('trust proxy', 1);
  // FRONTEND_URL poate conține mai multe adrese separate prin virgulă
  // (ex: http://localhost:5173,https://the-medfinders.vercel.app)
  app.use(cors({ origin: FRONTEND_URL.split(',').map((u) => u.trim().replace(/\/$/, '')) }));
  app.use(express.json({ limit: '100kb' }));

  if (!options.quiet) {
    app.use((req, _res, next) => {
      console.log(`[API] ${req.method} ${req.originalUrl}`);
      next();
    });
  }

  // ------------------------------------------------------------------
  // Autentificare Auth0 (token JWT trimis de frontend în header-ul
  // "Authorization: Bearer ...")
  // ------------------------------------------------------------------
  const notConfigured = (what) => (_req, res) =>
    res.status(503).json({ error: `${what} nu este configurat pe server` });

  const checkJwt = authConfig ? auth(authConfig) : notConfigured('Auth0');
  const optionalJwt = authConfig ? auth({ ...authConfig, authRequired: false }) : (_req, _res, next) => next();
  const needDb = (req, res, next) => (users.isEnabled() ? next() : notConfigured('Baza de date PostgreSQL')(req, res));

  // Găsește / creează utilizatorul din baza de date pe baza token-ului
  const loadUser = asyncRoute(async (req, _res, next) => {
    const sub = req.auth?.payload?.sub;
    if (sub) req.user = await users.upsertUser(sub);
    next();
  });

  const requireUser = [needDb, checkJwt, loadUser];

  // Rutele care modifică lista de clinici: doar cu cheia de admin
  const requireAdmin = (req, res, next) => {
    if (!ADMIN_API_KEY) return res.status(403).json({ error: 'Modificarea clinicilor este dezactivată (lipsește ADMIN_API_KEY)' });
    if (req.get('x-admin-key') !== ADMIN_API_KEY) return res.status(401).json({ error: 'Cheie de admin invalidă' });
    next();
  };

  // ------------------------------------------------------------------
  // Rute generale
  // ------------------------------------------------------------------

  app.get('/', (_req, res) => {
    res.json({
      name: 'The-MedFinders API',
      endpoints: [
        'GET    /api/health',
        'GET    /api/db-info',
        'GET    /api/places',
        'GET    /api/places/:id',
        'POST   /api/places              (admin)',
        'PUT    /api/places/:id          (admin)',
        'DELETE /api/places/:id          (admin)',
        'GET    /api/places/:id/reviews',
        'POST   /api/places/:id/reviews  (login)',
        'GET    /api/categories',
        'GET    /api/specialties',
        'POST   /api/sync                (admin)',
        'POST   /api/me                  (login)',
        'GET    /api/me                  (login)',
        'GET    /api/me/favorites        (login)',
        'PUT    /api/me/favorites/:placeId (login)',
        'POST   /api/me/favorites        (login)',
        'DELETE /api/me/favorites/:placeId (login)',
        'POST   /api/contacts            (login optional)',
        'GET    /api/me/contacts         (login)'
      ]
    });
  });

  app.get('/api/health', asyncRoute(async (_req, res) => {
    let database = 'not configured';
    if (users.isEnabled()) {
      try {
        await users.ping();
        database = 'ok';
      } catch {
        database = 'error';
      }
    }
    res.json({ status: 'ok', database, auth0: authConfig ? 'configured' : 'not configured', time: new Date().toISOString() });
  }));

  app.get('/api/db-info', asyncRoute(async (_req, res) => {
    res.json(await db.getDatabaseInfo());
  }));

  // ------------------------------------------------------------------
  // Clinici / locații medicale
  // ------------------------------------------------------------------

  // Listă cu filtre opționale prin query string, ex:
  // /api/places?category=hospital&area=Cetate&specialty=Cardiologie&open24h=true&q=spital
  app.get('/api/places', asyncRoute(async (req, res) => {
    res.json(await db.getPlaces(req.query));
  }));

  app.get('/api/places/:id', asyncRoute(async (req, res) => {
    const place = await db.getPlaceById(req.params.id);
    if (!place) return res.status(404).json({ error: 'Clinica nu a fost găsită' });
    res.json(place);
  }));

  app.post('/api/places', requireAdmin, asyncRoute(async (req, res) => {
    const { name, lat, lng } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Câmpul "name" este obligatoriu' });
    }
    if ((lat !== undefined && isNaN(Number(lat))) || (lng !== undefined && isNaN(Number(lng)))) {
      return res.status(400).json({ error: 'Câmpurile "lat" și "lng" trebuie să fie numere' });
    }
    res.status(201).json(await db.addPlace(req.body));
  }));

  app.put('/api/places/:id', requireAdmin, asyncRoute(async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Corpul cererii trebuie să fie un obiect JSON' });
    }
    const updated = await db.updatePlace(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Clinica nu a fost găsită' });
    res.json(updated);
  }));

  app.delete('/api/places/:id', requireAdmin, asyncRoute(async (req, res) => {
    const ok = await db.deletePlace(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Clinica nu a fost găsită' });
    res.status(204).end();
  }));

  // ------------------------------------------------------------------
  // Recenzii (aceeași formă ca în frontend/src/reviews/useReviews.js)
  // ------------------------------------------------------------------

  app.get('/api/places/:id/reviews', asyncRoute(async (req, res) => {
    const place = await db.getPlaceById(req.params.id);
    if (!place) return res.status(404).json({ error: 'Clinica nu a fost găsită' });
    res.json(place.reviews || []);
  }));

  // Corp: { rating: 1-5, text: "..." }. Autorul vine din contul Auth0.
  // O singură recenzie per utilizator per clinică: una nouă o înlocuiește pe cea veche.
  app.post('/api/places/:id/reviews', ...requireUser, asyncRoute(async (req, res) => {
    const { rating, text } = req.body || {};
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: 'Câmpul "rating" trebuie să fie un număr întreg între 1 și 5' });
    }

    const place = await db.getPlaceById(req.params.id);
    if (!place) return res.status(404).json({ error: 'Clinica nu a fost găsită' });

    const authorKey = req.user.auth0_id;
    const review = {
      id: `${authorKey}-${Date.now()}`,
      author: req.user.name || 'Utilizator',
      authorId: authorKey,
      rating: r,
      text: typeof text === 'string' ? text.trim().slice(0, 2000) : '',
      date: new Date().toISOString().slice(0, 10)
    };

    const others = (place.reviews || []).filter((rev) => rev.authorId !== authorKey);
    await db.updatePlace(place.id, { reviews: [review, ...others] });
    res.status(201).json(review);
  }));

  // ------------------------------------------------------------------
  // Statistici și sincronizare
  // ------------------------------------------------------------------

  app.get('/api/categories', asyncRoute(async (_req, res) => {
    res.json(await db.getCategoriesStats());
  }));

  app.get('/api/specialties', asyncRoute(async (_req, res) => {
    res.json(await db.getSpecialtiesStats());
  }));

  // Reîncarcă datele din database/timisoara_clinics.sql
  app.post('/api/sync', requireAdmin, asyncRoute(async (_req, res) => {
    const places = await db.reloadFromSqlDatabase();
    res.json({ message: 'Baza de date a fost resincronizată', totalClinics: places.length });
  }));

  // ------------------------------------------------------------------
  // Contul utilizatorului (Auth0 + PostgreSQL)
  // ------------------------------------------------------------------

  // Apelat de frontend după login: salvează numele / emailul / poza din profilul Auth0
  // Corp: { email, name, picture }
  app.post('/api/me', ...requireUser, asyncRoute(async (req, res) => {
    const user = await users.upsertUser(req.auth.payload.sub, req.body || {});
    res.json(user);
  }));

  app.get('/api/me', ...requireUser, (req, res) => {
    res.json(req.user);
  });

  // Clinici salvate: listă de ID-uri, ex. [3, 17, 42]
  app.get('/api/me/favorites', ...requireUser, asyncRoute(async (req, res) => {
    res.json(await users.getFavorites(req.user.user_id));
  }));

  // Adaugă mai multe deodată (ex. favoritele vechi din browser). Corp: { placeIds: [1, 2] }
  app.post('/api/me/favorites', ...requireUser, asyncRoute(async (req, res) => {
    const raw = req.body?.placeIds;
    if (!Array.isArray(raw) || raw.length > 500) {
      return res.status(400).json({ error: 'Câmpul "placeIds" trebuie să fie o listă de ID-uri' });
    }
    const ids = [...new Set(raw.map(toPlaceId).filter(Boolean))];
    await users.addFavorites(req.user.user_id, ids);
    res.json(await users.getFavorites(req.user.user_id));
  }));

  app.put('/api/me/favorites/:placeId', ...requireUser, asyncRoute(async (req, res) => {
    const placeId = toPlaceId(req.params.placeId);
    if (!placeId) return res.status(400).json({ error: 'ID de clinică invalid' });
    await users.addFavorites(req.user.user_id, [placeId]);
    res.json(await users.getFavorites(req.user.user_id));
  }));

  app.delete('/api/me/favorites/:placeId', ...requireUser, asyncRoute(async (req, res) => {
    const placeId = toPlaceId(req.params.placeId);
    if (!placeId) return res.status(400).json({ error: 'ID de clinică invalid' });
    await users.removeFavorite(req.user.user_id, placeId);
    res.json(await users.getFavorites(req.user.user_id));
  }));

  // ------------------------------------------------------------------
  // Istoric contactări (apel / WhatsApp / email)
  // ------------------------------------------------------------------

  // Corp: { placeId, kind: "call" | "whatsapp" | "email", target: "0256 000 000" }
  // Funcționează și fără login (se salvează fără utilizator).
  // placeId poate fi id-ul numeric sau codul clinicii ("medlife-spital").
  // Clicul ajunge și în statisticile din Tiger Data, chiar fără PostgreSQL-ul de pe Render.
  app.post('/api/contacts', optionalJwt, (req, res, next) => (users.isEnabled() ? loadUser(req, res, next) : next()), asyncRoute(async (req, res) => {
    const { placeId, kind, target } = req.body || {};
    const place = await resolvePlace(placeId);
    if (!place) return res.status(400).json({ error: 'Câmpul "placeId" este obligatoriu (id sau cod de clinică)' });
    if (!users.CONTACT_KINDS.includes(kind)) {
      return res.status(400).json({ error: `Câmpul "kind" trebuie să fie unul din: ${users.CONTACT_KINDS.join(', ')}` });
    }
    const userId = req.user?.user_id ?? null;

    await analytics.record({ placeCode: place.code, kind, userId }).catch((err) =>
      console.error('[Analytics] Clic neînregistrat:', err.message)
    );
    if (!users.isEnabled()) return res.status(201).json({ placeId: place.id, kind, savedToHistory: false });

    const event = await users.addContactEvent({
      userId,
      placeId: place.id,
      kind,
      target: typeof target === 'string' ? target : null
    });
    res.status(201).json(event);
  }));

  app.get('/api/me/contacts', ...requireUser, asyncRoute(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    res.json(await users.getContactEvents(req.user.user_id, limit));
  }));

  // ------------------------------------------------------------------
  // Statistici (Tiger Data): "ore aglomerate" și panoul de cerere.
  // Doar date reale; fără TIGER_DATABASE_URL răspund 503 și site-ul le ascunde.
  // ------------------------------------------------------------------

  const needTiger = (req, res, next) => (analytics.isEnabled() ? next() : notConfigured('Tiger Data (TIGER_DATABASE_URL)')(req, res));

  app.get('/api/analytics/popular-times/:placeId', needTiger, asyncRoute(async (req, res) => {
    const place = await resolvePlace(req.params.placeId);
    if (!place) return res.status(404).json({ error: 'Clinica nu există' });
    res.json(await analytics.popularTimes(place.code));
  }));

  app.get('/api/analytics/dashboard', needTiger, asyncRoute(async (req, res) => {
    res.json(await analytics.dashboard(req.query.days));
  }));

  // ------------------------------------------------------------------
  // 404 și erori
  // ------------------------------------------------------------------

  app.use((req, res) => {
    res.status(404).json({ error: `Ruta ${req.method} ${req.originalUrl} nu există` });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON invalid în corpul cererii' });
    }
    // Erori Auth0: token lipsă / expirat / invalid
    if (err.status === 401 || err.status === 403 || err.name === 'UnauthorizedError' || err.name === 'InvalidTokenError') {
      return res.status(err.status || 401).json({ error: 'Trebuie să fii autentificat', detail: err.message });
    }
    console.error('[API] Eroare:', err);
    res.status(500).json({ error: 'Eroare internă a serverului' });
  });

  return app;
}

// ---------------------------------------------------------------------
// Pornire server
// ---------------------------------------------------------------------

async function start() {
  let places = [];
  try {
    places = await db.loadPlaces();
    console.log(`[DB] ${places.length} locații încărcate`);
  } catch (err) {
    console.error('[DB] Eroare la încărcarea clinicilor:', err.message);
  }

  try {
    await analytics.init();
  } catch (err) {
    console.error('[Tiger] Nu m-am putut conecta la Tiger Data:', err.message);
  }

  if (users.isEnabled()) {
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
