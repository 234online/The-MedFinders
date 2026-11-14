/**
 * Clinics (read from database/timisoara_clinics.sql via db/database.js).
 * Reading is public; changing the list needs the admin role.
 */

const express = require('express');
const places = require('../db/database');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const NOT_FOUND = { error: 'Clinica nu a fost găsită' };

module.exports = function placeRoutes({ requireUser, requireRole }) {
  const router = express.Router();
  const admin = requireRole('admin');

  router.get('/api/db-info', wrap(async (_req, res) => res.json(await places.getDatabaseInfo())));
  router.get('/api/categories', wrap(async (_req, res) => res.json(await places.getCategoriesStats())));
  router.get('/api/specialties', wrap(async (_req, res) => res.json(await places.getSpecialtiesStats())));

  // /api/places?category=hospital&area=Cetate&specialty=Cardiologie&open24h=true&q=spital
  router.get('/api/places', wrap(async (req, res) => res.json(await places.getPlaces(req.query))));

  router.get('/api/places/:id', wrap(async (req, res) => {
    const place = await places.getPlaceById(req.params.id);
    if (!place) return res.status(404).json(NOT_FOUND);
    res.json(place);
  }));

  router.post('/api/places', admin, wrap(async (req, res) => {
    const { name, lat, lng } = req.body || {};
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Câmpul "name" este obligatoriu' });
    if ((lat !== undefined && isNaN(Number(lat))) || (lng !== undefined && isNaN(Number(lng)))) {
      return res.status(400).json({ error: 'Câmpurile "lat" și "lng" trebuie să fie numere' });
    }
    res.status(201).json(await places.addPlace(req.body));
  }));

  router.put('/api/places/:id', admin, wrap(async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Corpul cererii trebuie să fie un obiect JSON' });
    }
    const updated = await places.updatePlace(req.params.id, req.body);
    if (!updated) return res.status(404).json(NOT_FOUND);
    res.json(updated);
  }));

  router.delete('/api/places/:id', admin, wrap(async (req, res) => {
    if (!(await places.deletePlace(req.params.id))) return res.status(404).json(NOT_FOUND);
    res.status(204).end();
  }));

  router.post('/api/sync', admin, wrap(async (_req, res) => {
    const list = await places.reloadFromSqlDatabase();
    res.json({ message: 'Baza de date a fost resincronizată', totalClinics: list.length });
  }));

  // ---------- Reviews ----------
  router.get('/api/places/:id/reviews', wrap(async (req, res) => {
    const place = await places.getPlaceById(req.params.id);
    if (!place) return res.status(404).json(NOT_FOUND);
    res.json(place.reviews || []);
  }));

  // { rating: 1-5, text }. The author comes from the logged-in account;
  // one review per user per clinic (a new one replaces the old one).
  router.post('/api/places/:id/reviews', requireUser, wrap(async (req, res) => {
    const r = Number(req.body?.rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: 'Câmpul "rating" trebuie să fie un număr întreg între 1 și 5' });
    }
    const place = await places.getPlaceById(req.params.id);
    if (!place) return res.status(404).json(NOT_FOUND);

    const authorId = req.user.auth0_id;
    const review = {
      id: `${authorId}-${Date.now()}`,
      author: req.user.name || 'Utilizator',
      authorId,
      rating: r,
      text: typeof req.body.text === 'string' ? req.body.text.trim().slice(0, 2000) : '',
      date: new Date().toISOString().slice(0, 10)
    };
    const others = (place.reviews || []).filter((rev) => rev.authorId !== authorId);
    await places.updatePlace(place.id, { reviews: [review, ...others] });
    res.status(201).json(review);
  }));

  return router;
};
