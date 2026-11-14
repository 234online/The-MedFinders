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
 *   GET    /api/me/medical            my medical details
 *   PUT    /api/me/medical            save them { bloodType, allergies[], conditions[], medications[{name,dose}] }
 *   GET    /api/me/appointments       my appointments
 *   POST   /api/me/appointments       book { placeId, date: "YYYY-MM-DD", time: "HH:MM", reason }
 *   POST   /api/me/appointments/:id/cancel
 *
 * New features for the user (e.g. appointments) can follow the same
 * pattern: repositories/<feature>.js + routes here or in a new file.
 */

const express = require('express');
const users = require('../repositories/users');
const favorites = require('../repositories/favorites');
const contacts = require('../repositories/contacts');
const medical = require('../repositories/medical');
const appointments = require('../repositories/appointments');
const places = require('../db/database');
const { placeId, profileChanges, medicalProfile, newAppointment } = require('./validate');

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

  // ---------- Medical details (shown to doctors where the patient booked) ----------
  router.get('/api/me/medical', wrap(async (req, res) => {
    res.json(await medical.get(req.user.id));
  }));

  router.put('/api/me/medical', wrap(async (req, res) => {
    const { value, error } = medicalProfile(req.body);
    if (error) return res.status(400).json({ error });
    res.json(await medical.save(req.user.id, value));
  }));

  // ---------- Appointments ----------
  router.get('/api/me/appointments', wrap(async (req, res) => {
    res.json(await appointments.listForPatient(req.user.id));
  }));

  router.post('/api/me/appointments', wrap(async (req, res) => {
    const { value, error } = newAppointment(req.body);
    if (error) return res.status(400).json({ error });
    if (!(await places.getPlaceById(value.placeId))) return res.status(404).json({ error: 'Clinica nu a fost găsită' });
    if ((await appointments.countOpen(req.user.id)) >= appointments.MAX_OPEN_PER_PATIENT) {
      return res.status(429).json({ error: `Poți avea cel mult ${appointments.MAX_OPEN_PER_PATIENT} programări active` });
    }
    res.status(201).json(await appointments.create({ patientId: req.user.id, ...value }));
  }));

  router.post('/api/me/appointments/:id/cancel', wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID invalid' });
    const updated = await appointments.cancelByPatient(id, req.user.id);
    if (!updated) return res.status(404).json({ error: 'Programarea nu există sau nu mai poate fi anulată' });
    res.json(updated);
  }));

  return router;
};
