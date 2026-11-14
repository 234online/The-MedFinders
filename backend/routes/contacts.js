/**
 * POST /api/contacts  { placeId, kind: "call" | "whatsapp" | "email", target }
 * Records a click on Call / WhatsApp / Email. Works without login too
 * (saved without a user).
 */

const express = require('express');
const contacts = require('../repositories/contacts');
const { placeId } = require('./validate');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = function contactRoutes({ optionalUser }) {
  const router = express.Router();

  router.post('/api/contacts', optionalUser, wrap(async (req, res) => {
    const { kind, target } = req.body || {};
    const { value: id, error } = placeId(req.body?.placeId);
    if (error) return res.status(400).json({ error: 'Câmpul "placeId" lipsește sau este invalid' });
    if (!contacts.KINDS.includes(kind)) {
      return res.status(400).json({ error: `Câmpul "kind" trebuie să fie unul din: ${contacts.KINDS.join(', ')}` });
    }
    const event = await contacts.add({
      userId: req.user?.id ?? null,
      placeId: id,
      kind,
      target: typeof target === 'string' ? target : null
    });
    res.status(201).json(event);
  }));

  return router;
};
