-- =====================================================================
--  USER DATA (PostgreSQL on Render)
--  Runs automatically every time the backend starts (safe to repeat:
--  it only creates what is missing, it never deletes data).
--  The clinics themselves stay in database/timisoara_clinics.sql;
--  place_id below is the "id" field from frontend/src/data/places.json.
-- =====================================================================

-- One row per person who logged in with Auth0
CREATE TABLE IF NOT EXISTS users (
    id           SERIAL PRIMARY KEY,
    auth0_id     VARCHAR(255) NOT NULL UNIQUE,     -- Auth0 "sub", e.g. google-oauth2|1234 or auth0|abcd
    email        VARCHAR(255),
    name         VARCHAR(255),
    picture      TEXT,
    role         VARCHAR(50)  DEFAULT 'patient',
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Changes for a "users" table that already existed before this file:
--  - last login time
--  - email may be empty (phone-number logins have none) and is not unique
--    (the same email can log in with Google and with a password = 2 Auth0 accounts)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Saved (favourite) clinics
CREATE TABLE IF NOT EXISTS favorites (
    user_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    place_id     INTEGER      NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, place_id)
);

-- Every time someone presses Call / WhatsApp / Email on a clinic.
-- user_id is empty when the visitor was not logged in.
CREATE TABLE IF NOT EXISTS contact_events (
    event_id     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    place_id     INTEGER      NOT NULL,
    kind         VARCHAR(10)  NOT NULL CHECK (kind IN ('call', 'whatsapp', 'email')),
    target       VARCHAR(254),                     -- the phone number or email address used
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_events_user_idx  ON contact_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_events_place_idx ON contact_events (place_id);
