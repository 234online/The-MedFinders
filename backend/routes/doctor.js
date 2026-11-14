/**
 * Doctor dashboard (frontend: src/doctor/). Only for users with
 * role = 'doctor' (set in Auth0, see backend/auth0/README.md).
 * Everything comes from the patients' own data: their account (users),
 * medical details (medical_profiles) and appointment requests. A doctor
 * works at one or more clinics (doctor_clinics) and only sees patients who
 * sent a request to one of them. Every doctor of a clinic sees its requests.
 *
 *   GET   /api/doctor/me                  { id, name, specialty, clinics: [{ id, name }] }
 *   GET   /api/doctor/appointments        requests/appointments at my clinics (+ patient card)
 *   GET   /api/doctor/patients/:id        full medical record of one of my clinics' patients
 *                                         (incl. the list of documents they uploaded)
 *   GET   /api/doctor/patients/:id/documents/:docId/file   one of those documents (?download=1)
 *   PATCH /api/doctor/appointments/:id    { status?, diagnosis?, notes? }
 */

const express = require('express');
const users = require('../repositories/users');
const medical = require('../repositories/medical');
const appointments = require('../repositories/appointments');
const documents = require('../repositories/documents');
const { sendFile } = require('./documents');
const places = require('../db/database');
const { doctorAppointmentChanges } = require('./validate');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = function doctorRoutes({ requireRole }) {
  const router = express.Router();
  router.use('/api/doctor', requireRole('doctor'));

  const placeName = async (id) => (id ? (await places.getPlaceById(id))?.name ?? id : null);

  const clinicsOf = (user) => user.clinic_ids ?? [];

  router.get('/api/doctor/me', wrap(async (req, res) => {
    const { id, name, specialty } = req.user;
    const clinics = await Promise.all(clinicsOf(req.user).map(async (c) => ({ id: c, name: await placeName(c) })));
    res.json({ id, name, specialty, clinics });
  }));

  router.get('/api/doctor/appointments', wrap(async (req, res) => {
    const clinics = clinicsOf(req.user);
    if (clinics.length === 0) return res.json([]);
    res.json(await appointments.listForClinics(clinics, req.user.id));
  }));

  // A patient who sent a request to one of my clinics, for me or for
  // "any doctor" (patient id or null). Requests addressed to a colleague
  // don't give access to the record or the documents.
  const myPatient = async (req) => {
    const id = Number(req.params.id);
    const clinics = clinicsOf(req.user);
    if (!Number.isInteger(id) || clinics.length === 0) return null;
    return (await appointments.patientHasClinicAppointment(id, clinics, req.user.id)) ? id : null;
  };

  router.get('/api/doctor/patients/:id', wrap(async (req, res) => {
    const id = await myPatient(req);
    // Same answer for "doesn't exist" and "not your patient": reveals nothing
    if (id === null) return res.status(404).json({ error: 'Pacientul nu a fost găsit' });
    const [patient, med, history, docs] = await Promise.all([
      users.findById(id),
      medical.get(id),
      appointments.historyForPatient(id),
      documents.list(id)
    ]);
    if (!patient) return res.status(404).json({ error: 'Pacientul nu a fost găsit' });

    const visits = await Promise.all(
      history.map(async (a) => ({
        date: a.date,
        clinic: await placeName(a.placeId),
        doctor: a.doctor,
        reason: a.reason,
        diagnosis: a.diagnosis,
        notes: a.notes
      }))
    );
    res.json({
      id: patient.id,
      name: patient.name,
      birthDate: patient.birth_date,
      sex: patient.sex,
      phone: patient.phone,
      email: patient.email,
      ...med,
      visits,
      documents: docs
    });
  }));

  router.get('/api/doctor/patients/:id/documents/:docId/file', wrap(async (req, res) => {
    const id = await myPatient(req);
    const docId = Number(req.params.docId);
    // getFile only returns a document owned by this patient
    const file = id !== null && Number.isInteger(docId) ? await documents.getFile(id, docId) : null;
    if (!file) return res.status(404).json({ error: 'Documentul nu a fost găsit' });
    sendFile(res, file, Boolean(req.query.download));
  }));

  router.patch('/api/doctor/appointments/:id', wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID invalid' });
    const clinics = clinicsOf(req.user);
    if (clinics.length === 0) return res.status(404).json({ error: 'Programarea nu a fost găsită' });
    const { value, error } = doctorAppointmentChanges(req.body, appointments.STATUSES);
    if (error) return res.status(400).json({ error });
    const updated = await appointments.updateByDoctor(id, { ...value, placeIds: clinics, doctorId: req.user.id });
    if (!updated) return res.status(404).json({ error: 'Programarea nu a fost găsită' });
    res.json({ ...updated, handledBy: req.user.name });
  }));

  return router;
};
