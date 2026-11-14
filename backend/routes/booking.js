/**
 * Which clinics take online appointments, and with which doctors.
 * A clinic takes online appointments when at least one approved doctor
 * works there (doctor_clinics). Public: no login needed to look.
 *
 *   GET /api/booking/clinics        { "medlife-spital": 2, ... }  number of doctors per clinic
 *   GET /api/places/:id/doctors     [{ id, name, specialty }]
 */

const express = require('express');
const users = require('../repositories/users');
const db = require('../db/pool');
const { placeId } = require('./validate');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = function bookingRoutes() {
  const router = express.Router();

  // Without the database nobody can book: answer "no clinic takes bookings"
  router.get('/api/booking/clinics', wrap(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    res.json(db.isEnabled() ? await users.doctorCountsByClinic() : {});
  }));

  router.get('/api/places/:id/doctors', wrap(async (req, res) => {
    const { value, error } = placeId(req.params.id);
    if (error) return res.status(400).json({ error });
    res.set('Cache-Control', 'public, max-age=60');
    res.json(db.isEnabled() ? await users.doctorsAtClinic(value) : []);
  }));

  return router;
};
