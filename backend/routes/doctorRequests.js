/**
 * Becoming a doctor on the site.
 *
 * Anyone logged in can say "I'm a doctor at clinic X" (at sign-up or later
 * from "My account"). The account stays a patient account until an admin
 * approves, because doctors can read the medical details of the patients
 * who book at their clinics.
 *
 *   GET  /api/me/doctor-request                 my latest request (or null)
 *   POST /api/me/doctor-request                 { placeIds, specialty, licenseNumber, message? }
 *
 *   Admins (users.role = 'admin', or the x-admin-key header):
 *   GET  /api/admin/doctor-requests?status=pending|approved|rejected
 *   POST /api/admin/doctor-requests/:id/approve { placeIds?, specialty? }  (to correct them)
 *   POST /api/admin/doctor-requests/:id/reject  { note? }
 */

const express = require('express');
const users = require('../repositories/users');
const requests = require('../repositories/doctorRequests');
const places = require('../db/database');
const { grantDoctor } = require('../services/access');
const { doctorRequest, doctorApproval, reviewNote } = require('./validate');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const STATUSES = ['pending', 'approved', 'rejected'];

// Clinic codes that don't exist in the clinics database
async function unknownPlaces(placeIds) {
  const found = await Promise.all(placeIds.map((id) => places.getPlaceById(id)));
  return placeIds.filter((_, i) => !found[i]);
}

// Clinic names for the admin list / the person's own status
async function withClinicNames(request) {
  if (!request) return request;
  const clinics = await Promise.all(
    request.placeIds.map(async (id) => ({ id, name: (await places.getPlaceById(id))?.name ?? id }))
  );
  return { ...request, clinics };
}

module.exports = function doctorRequestRoutes({ requireUser, requireRole }) {
  const router = express.Router();
  const admin = requireRole('admin');

  // ---------- The person asking ----------
  router.get('/api/me/doctor-request', requireUser, wrap(async (req, res) => {
    res.json(await withClinicNames(await requests.latestForUser(req.user.id)));
  }));

  router.post('/api/me/doctor-request', requireUser, wrap(async (req, res) => {
    if (req.user.role !== 'patient') {
      return res.status(409).json({ error: 'Contul tău este deja un cont de medic sau de administrator' });
    }
    const { value, error } = doctorRequest(req.body);
    if (error) return res.status(400).json({ error });
    const unknown = await unknownPlaces(value.placeIds);
    if (unknown.length) return res.status(400).json({ error: `Clinica nu există: ${unknown.join(', ')}` });

    const created = await requests.create({ userId: req.user.id, ...value });
    if (!created) return res.status(409).json({ error: 'Ai deja o cerere în așteptare' });
    res.status(201).json(await withClinicNames(created));
  }));

  // ---------- Admin ----------
  router.get('/api/admin/doctor-requests', admin, wrap(async (req, res) => {
    const status = STATUSES.includes(req.query.status) ? req.query.status : 'pending';
    res.json(await Promise.all((await requests.list(status)).map(withClinicNames)));
  }));

  router.post('/api/admin/doctor-requests/:id/approve', admin, wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID invalid' });
    const { value: changes, error } = doctorApproval(req.body);
    if (error) return res.status(400).json({ error });

    const request = await requests.findById(id);
    if (!request) return res.status(404).json({ error: 'Cererea nu a fost găsită' });
    if (request.status !== 'pending') return res.status(409).json({ error: 'Cererea a fost deja analizată' });
    const person = await users.findById(request.userId);
    if (!person) return res.status(404).json({ error: 'Contul nu mai există' });
    if (person.role === 'admin') return res.status(409).json({ error: 'Un administrator nu poate fi făcut medic' });

    const placeIds = changes.placeIds ?? request.placeIds;
    const specialty = changes.specialty ?? request.specialty;
    const unknown = await unknownPlaces(placeIds);
    if (unknown.length) return res.status(400).json({ error: `Clinica nu există: ${unknown.join(', ')}` });

    // First Auth0 + users (can fail, e.g. Auth0 unreachable), then mark the request
    const granted = await grantDoctor(person, { placeIds, specialty });
    const decided = await requests.decide(id, {
      status: 'approved',
      reviewerId: req.user?.id ?? null,
      placeIds,
      specialty
    });
    res.json({
      request: await withClinicNames(decided ?? { ...request, status: 'approved' }),
      auth0: granted.auth0,
      ...(granted.auth0 === 'not-configured' && {
        warning:
          'Auth0 nu a fost actualizat (lipsesc AUTH0_MGMT_CLIENT_ID / AUTH0_MGMT_CLIENT_SECRET). ' +
          'Dacă Action-ul Auth0 este instalat, următoarea autentificare va reface contul de pacient.'
      })
    });
  }));

  router.post('/api/admin/doctor-requests/:id/reject', admin, wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID invalid' });
    const { value: note, error } = reviewNote(req.body);
    if (error) return res.status(400).json({ error });
    const decided = await requests.decide(id, { status: 'rejected', reviewerId: req.user?.id ?? null, note });
    if (!decided) return res.status(409).json({ error: 'Cererea nu există sau a fost deja analizată' });
    res.json(await withClinicNames(decided));
  }));

  return router;
};
