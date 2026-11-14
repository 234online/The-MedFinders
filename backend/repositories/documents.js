/**
 * medical_documents table: files a patient uploads (medical letters,
 * imaging, lab results). Every query is filtered by user_id, so a user
 * can only ever see or delete their own files.
 */

const db = require('../db/pool');

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100 MB per user
const MAX_FILES = 100;

// Everything except the file contents
const COLUMNS = `id, category, title, file_name, mime_type, size_bytes,
  to_char(document_date, 'YYYY-MM-DD') AS document_date, created_at`;

const toApi = (row) => ({
  id: row.id,
  category: row.category,
  title: row.title,
  fileName: row.file_name,
  mimeType: row.mime_type,
  size: row.size_bytes,
  date: row.document_date,
  createdAt: row.created_at
});

async function list(userId) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM medical_documents WHERE user_id = $1
     ORDER BY COALESCE(medical_documents.document_date, created_at::date) DESC, created_at DESC`,
    [userId]
  );
  return rows.map(toApi);
}

async function usage(userId) {
  const { rows } = await db.query(
    'SELECT COUNT(*)::int AS count, COALESCE(SUM(size_bytes), 0)::bigint AS bytes FROM medical_documents WHERE user_id = $1',
    [userId]
  );
  return { count: rows[0].count, bytes: Number(rows[0].bytes) };
}

async function create(userId, { category, title, fileName, mimeType, date, data }) {
  const { rows } = await db.query(
    `INSERT INTO medical_documents (user_id, category, title, file_name, mime_type, size_bytes, data, document_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${COLUMNS}`,
    [userId, category, title, fileName, mimeType, data.length, data, date]
  );
  return toApi(rows[0]);
}

// The file itself (null when it doesn't exist or isn't this user's)
async function getFile(userId, id) {
  const { rows } = await db.query(
    'SELECT file_name, mime_type, data FROM medical_documents WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rows[0] ? { fileName: rows[0].file_name, mimeType: rows[0].mime_type, data: rows[0].data } : null;
}

async function update(userId, id, { category, title, date }) {
  const { rows } = await db.query(
    `UPDATE medical_documents SET
       category = COALESCE($3, category),
       title = COALESCE($4, title),
       document_date = CASE WHEN $5::boolean THEN $6::date ELSE document_date END
     WHERE id = $1 AND user_id = $2
     RETURNING ${COLUMNS}`,
    [id, userId, category ?? null, title ?? null, date !== undefined, date ?? null]
  );
  return rows[0] ? toApi(rows[0]) : null;
}

async function remove(userId, id) {
  const { rowCount } = await db.query('DELETE FROM medical_documents WHERE id = $1 AND user_id = $2', [id, userId]);
  return rowCount > 0;
}

module.exports = { list, usage, create, getFile, update, remove, MAX_FILE_BYTES, MAX_TOTAL_BYTES, MAX_FILES };
