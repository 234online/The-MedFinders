-- =====================================================================
--  ANALYTICS ON TIGER DATA (TimescaleDB)
--  Runs automatically when the backend starts with TIGER_DATABASE_URL set.
--  Safe to repeat: it only creates what is missing.
--
--  Each statement is run on its own (continuous aggregates can't be
--  created inside a transaction), so keep one statement per ";".
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- One row per real Call / WhatsApp / Email click on a clinic.
-- place_code is the clinic's "code" from timisoara_clinics.sql
-- (the same id the website uses, e.g. 'medlife-spital').
-- user_id is the users.id on Render when the visitor was logged in.
CREATE TABLE IF NOT EXISTS contact_activity (
    time        TIMESTAMPTZ NOT NULL,
    place_code  TEXT        NOT NULL,
    kind        TEXT        NOT NULL CHECK (kind IN ('call', 'whatsapp', 'email')),
    user_id     INTEGER
);

-- Hypertable: the table is split into 7-day "chunks" by time, so queries
-- over recent days only read recent chunks.
SELECT create_hypertable('contact_activity', by_range('time', INTERVAL '7 days'), if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS contact_activity_place_idx ON contact_activity (place_code, time DESC);

-- Continuous aggregate: clicks per clinic, per channel, per hour.
-- TimescaleDB keeps it up to date by itself (policy below), so the
-- dashboard and "popular times" read a small summary instead of every click.
CREATE MATERIALIZED VIEW IF NOT EXISTS contact_activity_hourly
WITH (timescaledb.continuous) AS
SELECT time_bucket(INTERVAL '1 hour', time) AS bucket,
       place_code,
       kind,
       count(*) AS contacts
FROM contact_activity
GROUP BY bucket, place_code, kind
WITH NO DATA;

-- Real-time aggregation: the summary also includes the newest clicks that
-- haven't been materialized yet, so "right now" numbers are live.
ALTER MATERIALIZED VIEW contact_activity_hourly SET (timescaledb.materialized_only = false);

-- Refresh the summary every 15 minutes, for the last 60 days.
SELECT add_continuous_aggregate_policy('contact_activity_hourly',
    start_offset      => INTERVAL '60 days',
    end_offset        => INTERVAL '1 hour',
    schedule_interval => INTERVAL '15 minutes',
    if_not_exists     => TRUE);

-- Compression: clicks older than 7 days are stored compressed
-- (grouped per clinic, newest first). Queries still work the same.
ALTER TABLE contact_activity SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'place_code',
    timescaledb.compress_orderby   = 'time DESC'
);

SELECT add_compression_policy('contact_activity', INTERVAL '7 days', if_not_exists => TRUE);
