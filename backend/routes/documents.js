/**
 * "My documents": medical files the logged-in user uploads
 * (medical letters, MRI / CT / X-ray images, lab results, ...).
 * Each file belongs to one user; nobody else can list, open or delete it.
 *
 *   GET    /api/me/documents            list (no file contents) + storage usage
 *   POST   /api/me/documents            upload one file. The body is the raw file,
 *                                       with its Content-Type; details go in the query:
 *                                       ?fileName=...&category=mri&title=...&date=YYYY-MM-DD
 *   GET    /api/me/documents/:id/file   the file itself (?download=1 to save it)
 *   PATCH  /api/me/documents/:id        edit { category, title, date }
 *   DELETE /api/me/documents/:id
 */

const express = require('express');
const documents = require('../repositories/documents');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const CATEGORIES = ['letter', 'lab', 'xray', 'mri', 'ct', 'ultrasound', 'prescription', 'other'];

// Only documents and images. No HTML / SVG / scripts: those could run
// code when opened in the browser.
const MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/heic',
  'image/heif',
  'application/dicom', // MRI / CT / X-ray scans from the clinic's CD
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/rtf',
  'text/plain'
]);

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function text(v, max) {
  if (typeof v !== 'string') return null;
  // no control characters (they would break the download header)
  const s = v.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return s ? s.slice(0, max) : null;
}

function validDate(v) {
  if (!DAY.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !isNaN(d) && d.toISOString().slice(0, 10) === v && v >= '1900-01-01' && d <= new Date();
}

// { category, title, date } shared by upload and edit; undefined = not sent
function details(src) {
  const out = {};
  if (src.category !== undefined) {
    if (!CATEGORIES.includes(src.category)) return { error: `Categoria trebuie să fie: ${CATEGORIES.join(', ')}` };
    out.category = src.category;
  }
  if (src.title !== undefined) {
    out.title = text(src.title, 200);
    if (!out.title) return { error: 'Titlul nu poate fi gol' };
  }
  if (src.date !== undefined) {
    if (src.date === null || src.date === '') out.date = null;
    else if (validDate(src.date)) out.date = src.date;
    else return { error: 'Data documentului trebuie să fie AAAA-LL-ZZ și nu în viitor' };
  }
  return { value: out };
}

const idParam = (req, res) => {
  const id = Number(req.params.id);
  if (Number.isInteger(id) && id > 0) return id;
  res.status(400).json({ error: 'ID invalid' });
  return null;
};

// Sends a stored file. Also used by the doctor dashboard (routes/doctor.js).
function sendFile(res, file, download) {
  const ascii = file.fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  res.set({
    'Content-Type': file.mimeType,
    'Content-Length': file.data.length,
    'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': 'sandbox',
    'Cache-Control': 'private, no-store'
  });
  res.end(file.data);
}

module.exports = function documentRoutes({ requireUser }) {
  const router = express.Router();
  router.use('/api/me/documents', requireUser);

  router.get('/api/me/documents', wrap(async (req, res) => {
    const [items, used] = await Promise.all([documents.list(req.user.id), documents.usage(req.user.id)]);
    res.json({
      documents: items,
      usage: { ...used, maxBytes: documents.MAX_TOTAL_BYTES, maxFileBytes: documents.MAX_FILE_BYTES, maxFiles: documents.MAX_FILES }
    });
  }));

  router.post(
    '/api/me/documents',
    express.raw({ type: () => true, limit: documents.MAX_FILE_BYTES }),
    wrap(async (req, res) => {
      const mimeType = (req.get('content-type') || '').split(';')[0].trim().toLowerCase();
      if (!MIME_TYPES.has(mimeType)) {
        return res.status(415).json({ error: 'Tip de fișier neacceptat. Încarcă PDF, imagini (PNG, JPG, ...), DICOM sau documente Word/text.' });
      }
      const data = req.body;
      if (!Buffer.isBuffer(data) || data.length === 0) return res.status(400).json({ error: 'Fișierul este gol' });

      const fileName = text(req.query.fileName, 255) || 'document';
      const { value, error } = details({ category: req.query.category ?? 'other', title: req.query.title ?? fileName, date: req.query.date });
      if (error) return res.status(400).json({ error });

      const used = await documents.usage(req.user.id);
      if (used.count >= documents.MAX_FILES) {
        return res.status(429).json({ error: `Poți păstra cel mult ${documents.MAX_FILES} documente` });
      }
      if (used.bytes + data.length > documents.MAX_TOTAL_BYTES) {
        return res.status(413).json({ error: `Spațiul tău de ${documents.MAX_TOTAL_BYTES / 1024 / 1024} MB este plin. Șterge documente vechi.` });
      }

      const created = await documents.create(req.user.id, { ...value, date: value.date ?? null, fileName, mimeType, data });
      res.status(201).json(created);
    })
  );

  router.get('/api/me/documents/:id/file', wrap(async (req, res) => {
    const id = idParam(req, res);
    if (id === null) return;
    const file = await documents.getFile(req.user.id, id);
    if (!file) return res.status(404).json({ error: 'Documentul nu există' });

    sendFile(res, file, Boolean(req.query.download));
  }));

  router.patch('/api/me/documents/:id', wrap(async (req, res) => {
    const id = idParam(req, res);
    if (id === null) return;
    const { value, error } = details(req.body || {});
    if (error) return res.status(400).json({ error });
    const updated = await documents.update(req.user.id, id, value);
    if (!updated) return res.status(404).json({ error: 'Documentul nu există' });
    res.json(updated);
  }));

  router.delete('/api/me/documents/:id', wrap(async (req, res) => {
    const id = idParam(req, res);
    if (id === null) return;
    if (!(await documents.remove(req.user.id, id))) return res.status(404).json({ error: 'Documentul nu există' });
    res.status(204).end();
  }));

  return router;
};

module.exports.sendFile = sendFile;
