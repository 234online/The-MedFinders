-- =====================================================================
--  MIGRATION 004: medical documents a patient uploads on "My account"
--  (medical letters, MRI / CT / X-ray images, lab results, ...).
--
--  The file itself is stored in the database (BYTEA): Render's disk is
--  wiped on every deploy, so files on disk would be lost. Size limits are
--  enforced in routes/documents.js. Deleting the user deletes the files.
-- =====================================================================

CREATE TABLE IF NOT EXISTS medical_documents (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category     VARCHAR(20)  NOT NULL DEFAULT 'other'
                 CHECK (category IN ('letter', 'lab', 'xray', 'mri', 'ct', 'ultrasound', 'prescription', 'other')),
    title        VARCHAR(200) NOT NULL,              -- shown in the list (defaults to the file name)
    file_name    VARCHAR(255) NOT NULL,              -- original name, used when downloading
    mime_type    VARCHAR(100) NOT NULL,
    size_bytes   INTEGER      NOT NULL,
    data         BYTEA        NOT NULL,
    document_date DATE,                              -- when the investigation was done (optional)
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS medical_documents_user_idx ON medical_documents (user_id, created_at DESC);
