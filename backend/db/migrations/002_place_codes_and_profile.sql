-- =====================================================================
--  MIGRATION 002
--  1. Places are identified by their text code from the clinics
--     database (e.g. 'medlife-spital'), not by a number any more.
--  2. Profile fields the user can fill in on the "My account" page,
--     useful later for appointments.
-- =====================================================================

ALTER TABLE favorites      ALTER COLUMN place_id TYPE VARCHAR(80) USING place_id::text;
ALTER TABLE contact_events ALTER COLUMN place_id TYPE VARCHAR(80) USING place_id::text;

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone              VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date         DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
