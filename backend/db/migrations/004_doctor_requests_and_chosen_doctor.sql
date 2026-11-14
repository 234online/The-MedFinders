-- =====================================================================
--  MIGRATION 004
--  1. Doctor sign-up requests: a person says "I'm a doctor at clinic X";
--     their account stays a patient account until an admin approves the
--     request (doctors can read patients' medical details).
--  2. Appointments can be addressed to one chosen doctor of the clinic
--     (requested_doctor_id), or to any of them (NULL, as before).
-- =====================================================================

CREATE TABLE IF NOT EXISTS doctor_requests (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    place_ids      VARCHAR(80)[] NOT NULL,                 -- clinic codes, e.g. {medlife-spital}
    specialty      VARCHAR(120)  NOT NULL,
    license_number VARCHAR(30)   NOT NULL,                 -- registration number with the College of Physicians
    message        VARCHAR(500),
    status         VARCHAR(10)   NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
    review_note    VARCHAR(300),                           -- e.g. why it was rejected
    reviewed_by    INTEGER       REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CHECK (cardinality(place_ids) BETWEEN 1 AND 10)
);

-- At most one open request per person
CREATE UNIQUE INDEX IF NOT EXISTS doctor_requests_one_pending
    ON doctor_requests (user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS doctor_requests_status_idx ON doctor_requests (status, created_at);

ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS requested_doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS appointments_requested_doctor_idx ON appointments (requested_doctor_id);
