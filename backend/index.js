require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ========================================================
// Middleware-uri esențiale (trebuie să fie înaintea rutelor!)
// ========================================================

// Permite comunicarea cu frontend-ul (React / Vite)
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Permite serverului să înțeleagă datele în format JSON trimise de frontend
app.use(express.json());

// Logger simplu pentru cereri (util la debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ========================================================
// RUTE API (End-point-uri pentru conectarea cu Frontend-ul)
// ========================================================

/**
 * GET /
 * Pagina de pornire API / sumar status
 */
app.get('/', async (req, res) => {
  try {
    const dbInfo = await db.getDatabaseInfo();
    res.json({
      name: 'The-MedFinders Backend API',
      version: '1.0.0',
      status: 'online',
      message: 'Serverul backend este conectat și rulează!',
      database: dbInfo,
      endpoints: {
        allPlaces: '/api/places',
        filteredPlacesExample: '/api/places?category=hospital&open24h=true',
        placeById: '/api/places/:id',
        categories: '/api/categories',
        healthCheck: '/api/health',
        dbStatus: '/api/db-status'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Eroare la obținerea informațiilor API.' });
  }
});

/**
 * GET /api/health
 * Verificare de sănătate a serverului
 */
app.get('/api/health', async (req, res) => {
  try {
    const dbInfo = await db.getDatabaseInfo();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      databaseProvider: dbInfo.activeProvider,
      totalPlaces: dbInfo.totalPlaces
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

/**
 * GET /api/db-status
 * Informații despre starea bazei de date (acum JSON, ulterior baza aleasă)
 */
app.get('/api/db-status', async (req, res) => {
  try {
    const info = await db.getDatabaseInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/places
 * Returnează toate locurile din fișierul JSON (sau filtrate după query params)
 * Suportă parametri opționali: ?category=...&area=...&open24h=true&emergency=true&wheelchair=true&cnas=true&search=...
 */
app.get('/api/places', async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      area: req.query.area,
      open24h: req.query.open24h,
      emergency: req.query.emergency,
      wheelchair: req.query.wheelchair,
      cnas: req.query.cnas,
      search: req.query.search || req.query.q
    };

    const places = await db.getPlaces(filters);
    res.json(places);
  } catch (error) {
    console.error('Eroare GET /api/places:', error);
    res.status(500).json({ error: 'Eroare la preluarea listei de locații medicale.' });
  }
});

/**
 * GET /api/places/:id
 * Returnează un singur loc medical după ID
 */
app.get('/api/places/:id', async (req, res) => {
  try {
    const place = await db.getPlaceById(req.params.id);
    if (!place) {
      return res.status(404).json({ error: `Locația cu ID ${req.params.id} nu a fost găsită.` });
    }
    res.json(place);
  } catch (error) {
    console.error(`Eroare GET /api/places/${req.params.id}:`, error);
    res.status(500).json({ error: 'Eroare la căutarea locației.' });
  }
});

/**
 * POST /api/places
 * Adaugă o nouă locație medicală (acum salvează în JSON, mai târziu în DB)
 */
app.post('/api/places', async (req, res) => {
  try {
    const { name, category, lat, lng } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        error: 'Câmpurile "name" și "category" sunt obligatorii.'
      });
    }

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        error: 'Coordonatele "lat" și "lng" sunt obligatorii pentru afișarea pe hartă.'
      });
    }

    const createdPlace = await db.addPlace(req.body);
    res.status(201).json(createdPlace);
  } catch (error) {
    console.error('Eroare POST /api/places:', error);
    res.status(500).json({ error: 'Eroare la adăugarea locației.' });
  }
});

/**
 * PUT /api/places/:id
 * Actualizează o locație existentă
 */
app.put('/api/places/:id', async (req, res) => {
  try {
    const updated = await db.updatePlace(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: `Locația cu ID ${req.params.id} nu a fost găsită.` });
    }
    res.json(updated);
  } catch (error) {
    console.error(`Eroare PUT /api/places/${req.params.id}:`, error);
    res.status(500).json({ error: 'Eroare la actualizarea locației.' });
  }
});

/**
 * DELETE /api/places/:id
 * Șterge o locație după ID
 */
app.delete('/api/places/:id', async (req, res) => {
  try {
    const success = await db.deletePlace(req.params.id);
    if (!success) {
      return res.status(404).json({ error: `Locația cu ID ${req.params.id} nu a fost găsită.` });
    }
    res.json({ message: `Locația cu ID ${req.params.id} a fost ștearsă cu succes.` });
  } catch (error) {
    console.error(`Eroare DELETE /api/places/${req.params.id}:`, error);
    res.status(500).json({ error: 'Eroare la ștergerea locației.' });
  }
});

/**
 * GET /api/categories
 * Returnează categoriile și numărul de locații per categorie
 */
app.get('/api/categories', async (req, res) => {
  try {
    const stats = await db.getCategoriesStats();
    res.json(stats);
  } catch (error) {
    console.error('Eroare GET /api/categories:', error);
    res.status(500).json({ error: 'Eroare la calcularea statisticilor categoriilor.' });
  }
});

// ========================================================
// Gestionare erori & rute inexistente (404)
// ========================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta solicitată nu există pe acest server backend.',
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  console.error('Eroare internă server:', err.stack);
  res.status(500).json({
    error: 'A apărut o eroare neașteptată pe server.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========================================================
// Pornire server
// ========================================================

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(` MedFinders Backend rulează cu succes pe portul ${PORT}`);
  console.log(` API URL: http://localhost:${PORT}`);
  console.log(` Locații (JSON API): http://localhost:${PORT}/api/places`);
  console.log(` Conectat pentru frontend la: ${FRONTEND_URL}`);
  console.log(` Sursă date: Fișier JSON cu toate cele 100+ clinici din baza de date`);
  console.log('====================================================');
});
