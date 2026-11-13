require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/database');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Middleware-uri esențiale (trebuie să fie înaintea rutelor!)
// Permite frontend-ului (Vite) să comunice cu serverul
app.use(cors({ origin: FRONTEND_URL.split(',').map((u) => u.trim()) }));
app.use(express.json());  // Permite serverului să înțeleagă datele JSON trimise de frontend

// Log simplu pentru fiecare cerere
app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  next();
});

// Împachetează rutele async ca erorile să ajungă la handler-ul de erori
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------------------------------------------------------------------
// Rute generale
// ---------------------------------------------------------------------

app.get('/', (_req, res) => {
  res.json({
    name: 'The-MedFinders API',
    endpoints: [
      'GET    /api/health',
      'GET    /api/db-info',
      'GET    /api/places',
      'GET    /api/places/:id',
      'POST   /api/places',
      'PUT    /api/places/:id',
      'DELETE /api/places/:id',
      'GET    /api/places/:id/reviews',
      'POST   /api/places/:id/reviews',
      'GET    /api/categories',
      'GET    /api/specialties',
      'POST   /api/sync'
    ]
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/db-info', asyncRoute(async (_req, res) => {
  res.json(await db.getDatabaseInfo());
}));

// ---------------------------------------------------------------------
// Clinici / locații medicale
// ---------------------------------------------------------------------

// Listă cu filtre opționale prin query string, ex:
// /api/places?category=hospital&area=Cetate&specialty=Cardiologie&open24h=true&q=spital
// Fără filtre returnează același array ca frontend/src/data/places.json
app.get('/api/places', asyncRoute(async (req, res) => {
  const places = await db.getPlaces(req.query);
  res.json(places);
}));

app.get('/api/places/:id', asyncRoute(async (req, res) => {
  const place = await db.getPlaceById(req.params.id);
  if (!place) return res.status(404).json({ error: 'Clinica nu a fost găsită' });
  res.json(place);
}));

app.post('/api/places', asyncRoute(async (req, res) => {
  const { name, lat, lng } = req.body || {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Câmpul "name" este obligatoriu' });
  }
  if ((lat !== undefined && isNaN(Number(lat))) || (lng !== undefined && isNaN(Number(lng)))) {
    return res.status(400).json({ error: 'Câmpurile "lat" și "lng" trebuie să fie numere' });
  }
  const created = await db.addPlace(req.body);
  res.status(201).json(created);
}));

app.put('/api/places/:id', asyncRoute(async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Corpul cererii trebuie să fie un obiect JSON' });
  }
  const updated = await db.updatePlace(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Clinica nu a fost găsită' });
  res.json(updated);
}));

app.delete('/api/places/:id', asyncRoute(async (req, res) => {
  const ok = await db.deletePlace(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Clinica nu a fost găsită' });
  res.status(204).end();
}));

// ---------------------------------------------------------------------
// Recenzii (aceeași formă ca în frontend/src/reviews/useReviews.js)
// ---------------------------------------------------------------------

app.get('/api/places/:id/reviews', asyncRoute(async (req, res) => {
  const place = await db.getPlaceById(req.params.id);
  if (!place) return res.status(404).json({ error: 'Clinica nu a fost găsită' });
  res.json(place.reviews || []);
}));

// Corp: { rating: 1-5, text: "...", author: "Nume", authorEmail: "x@y.z" }
// O singură recenzie per utilizator per clinică: una nouă o înlocuiește pe cea veche.
app.post('/api/places/:id/reviews', asyncRoute(async (req, res) => {
  const { rating, text, author, authorEmail } = req.body || {};
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return res.status(400).json({ error: 'Câmpul "rating" trebuie să fie un număr întreg între 1 și 5' });
  }
  if (!author || typeof author !== 'string') {
    return res.status(400).json({ error: 'Câmpul "author" este obligatoriu' });
  }

  const place = await db.getPlaceById(req.params.id);
  if (!place) return res.status(404).json({ error: 'Clinica nu a fost găsită' });

  const review = {
    id: `${authorEmail || author}-${Date.now()}`,
    author: author.trim(),
    authorEmail: authorEmail || '',
    rating: r,
    text: typeof text === 'string' ? text.trim() : '',
    date: new Date().toISOString().slice(0, 10)
  };

  const others = (place.reviews || []).filter(
    (rev) => !(authorEmail && rev.authorEmail === authorEmail)
  );
  await db.updatePlace(place.id, { reviews: [review, ...others] });
  res.status(201).json(review);
}));

// ---------------------------------------------------------------------
// Statistici și sincronizare
// ---------------------------------------------------------------------

app.get('/api/categories', asyncRoute(async (_req, res) => {
  res.json(await db.getCategoriesStats());
}));

app.get('/api/specialties', asyncRoute(async (_req, res) => {
  res.json(await db.getSpecialtiesStats());
}));

// Reîncarcă datele din database/timisoara_clinics.sql (suprascrie backend/data/places.json)
app.post('/api/sync', asyncRoute(async (_req, res) => {
  const places = await db.reloadFromSqlDatabase();
  res.json({ message: 'Baza de date a fost resincronizată', totalClinics: places.length });
}));

// ---------------------------------------------------------------------
// 404 și erori
// ---------------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.originalUrl} nu există` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalid în corpul cererii' });
  }
  console.error('[API] Eroare:', err);
  res.status(500).json({ error: 'Eroare internă a serverului' });
});

// ---------------------------------------------------------------------
// Pornire server
// ---------------------------------------------------------------------

if (require.main === module) {
  db.loadPlaces()
    .then((places) => console.log(`[DB] ${places.length} locații încărcate`))
    .catch((err) => console.error('[DB] Eroare la încărcare:', err.message))
    .finally(() => {
      app.listen(PORT, () => {
        console.log(`[API] Server pornit pe http://localhost:${PORT}`);
        console.log(`[API] CORS permis pentru: ${FRONTEND_URL}`);
      });
    });
}

module.exports = app;
``

app.post('/api/users/sync', async (req, res) => {
  const { auth0_id, email, name, picture } = req.body;

  if (!auth0_id || !email) {
    return res.status(400).json({ error: 'auth0_id and email are required' });
  }

  try {
    const query = `
      INSERT INTO users (auth0_id, email, name, picture)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (auth0_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        picture = EXCLUDED.picture
      RETURNING *;
    `;
    const result = await pool.query(query, [auth0_id, email, name, picture]);
    res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error('Database sync error:', err);
    res.status(500).json({ error: 'Failed to sync user to database' });
  }
});