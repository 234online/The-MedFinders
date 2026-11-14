-- =====================================================================
--  USER DATA (PostgreSQL on Render)
--  Runs automatically every time the backend starts (safe to repeat:
--  it only creates what is missing, it never deletes data).
--  The clinics themselves stay in database/timisoara_clinics.sql;
--  place_id below is the "id" field from frontend/src/data/places.json.
-- =====================================================================

-- One row per person who logged in with Auth0
CREATE TABLE IF NOT EXISTS users (
    user_id      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    auth0_id     VARCHAR(128) NOT NULL UNIQUE,     -- Auth0 "sub", e.g. google-oauth2|1234 or auth0|abcd
    email        VARCHAR(254),
    name         VARCHAR(200),
    picture      TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_login   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Saved (favourite) clinics
CREATE TABLE IF NOT EXISTS favorites (
    user_id      INTEGER      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    place_id     INTEGER      NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, place_id)
);

-- Every time someone presses Call / WhatsApp / Email on a clinic.
-- user_id is empty when the visitor was not logged in.
CREATE TABLE IF NOT EXISTS contact_events (
    event_id     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      INTEGER      REFERENCES users(user_id) ON DELETE SET NULL,
    place_id     INTEGER      NOT NULL,
    kind         VARCHAR(10)  NOT NULL CHECK (kind IN ('call', 'whatsapp', 'email')),
    target       VARCHAR(254),                     -- the phone number or email address used
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_events_user_idx  ON contact_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_events_place_idx ON contact_events (place_id);
