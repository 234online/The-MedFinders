/**
 * "My account": everything about the logged-in user.
 *
 *   POST   /api/me                    after login: save name/email/photo from Auth0
 *   GET    /api/me                    profile
 *   PATCH  /api/me                    edit profile { name, phone, birth_date, preferred_language }
 *   DELETE /api/me                    delete my data on this site
 *   GET    /api/me/favorites          ["medlife-spital", ...]
 *   POST   /api/me/favorites          add several { placeIds: [...] }
 *   PUT    /api/me/favorites/:placeId add one
 *   DELETE /api/me/favorites/:placeId remove one
 *   GET    /api/me/contacts           my Call / WhatsApp / Email history
 *
 * New features for the user (e.g. appointments) can follow the same
 * pattern: repositories/<feature>.js + routes here or in a new file.
 */

const express = require('express');
const users = require('../repositories/users');
const favorites = require('../repositories/favorites');
const contacts = require('../repositories/contacts');
const { placeId, profileChanges } = require('./validate');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = function accountRoutes({ requireUser }) {
  const router = express.Router();
  router.use('/api/me', requireUser);

  router.post('/api/me', wrap(async (req, res) => {
    res.json(await users.upsertFromAuth0(req.auth.payload.sub, req.body || {}));
  }));

  router.get('/api/me', (req, res) => res.json(req.user));

  router.patch('/api/me', wrap(async (req, res) => {
    const { value: changes, error } = profileChanges(req.body);
    if (error) return res.status(400).json({ error });
    res.json(await users.updateProfile(req.user.id, changes));
  }));

  router.delete('/api/me', wrap(async (req, res) => {
    await users.remove(req.user.id);
    res.status(204).end();
  }));

  // ---------- Favourites ----------
  router.get('/api/me/favorites', wrap(async (req, res) => {
    res.json(await favorites.list(req.user.id));
  }));

  router.post('/api/me/favorites', wrap(async (req, res) => {
    const raw = req.body?.placeIds;
    if (!Array.isArray(raw) || raw.length > 500) {
      return res.status(400).json({ error: 'Câmpul "placeIds" trebuie să fie o listă de ID-uri' });
    }
    const ids = [...new Set(raw.map((v) => placeId(v).value).filter(Boolean))];
    await favorites.add(req.user.id, ids);
    res.json(await favorites.list(req.user.id));
  }));

  router.put('/api/me/favorites/:placeId', wrap(async (req, res) => {
    const { value, error } = placeId(req.params.placeId);
    if (error) return res.status(400).json({ error });
    await favorites.add(req.user.id, [value]);
    res.json(await favorites.list(req.user.id));
  }));

  router.delete('/api/me/favorites/:placeId', wrap(async (req, res) => {
    const { value, error } = placeId(req.params.placeId);
    if (error) return res.status(400).json({ error });
    await favorites.remove(req.user.id, value);
    res.json(await favorites.list(req.user.id));
  }));

  // ---------- Contact history ----------
  router.get('/api/me/contacts', wrap(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    res.json(await contacts.listForUser(req.user.id, limit));
  }));

  return router;
};
