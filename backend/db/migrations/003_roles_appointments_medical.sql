-- =====================================================================
--  MIGRATION 003: two kinds of accounts (patient / doctor),
--  appointments made on the site, and each patient's medical details.
--
--  Roles come from Auth0 (app_metadata.role, see backend/auth0/README.md)
--  and are copied into users.role at every login. A doctor can work at
--  several clinics (doctor_clinics, clinic codes such as 'medlife-spital')
--  and sees the appointment requests sent to all of them.
-- =====================================================================

UPDATE users SET role = 'patient' WHERE role IS NULL OR role NOT IN ('patient', 'doctor', 'admin');
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'patient';
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('patient', 'doctor', 'admin'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS sex       CHAR(1) CHECK (sex IN ('M', 'F'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(120);   -- doctors only

-- Which clinics each doctor works at (copied from Auth0 app_metadata.clinic_ids)
CREATE TABLE IF NOT EXISTS doctor_clinics (
    doctor_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    place_id     VARCHAR(80)  NOT NULL,                              -- clinic code
    PRIMARY KEY (doctor_id, place_id)
);

CREATE INDEX IF NOT EXISTS doctor_clinics_place_idx ON doctor_clinics (place_id);

-- Medical details a patient fills in on "My account".
-- A doctor can read them only for patients with an appointment at their clinic.
CREATE TABLE IF NOT EXISTS medical_profiles (
    user_id      INTEGER      PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    blood_type   VARCHAR(3)   CHECK (blood_type IN ('0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-')),
    allergies    TEXT[]       NOT NULL DEFAULT '{}',
    conditions   TEXT[]       NOT NULL DEFAULT '{}',
    medications  JSONB        NOT NULL DEFAULT '[]',   -- [{ "name": "...", "dose": "..." }]
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Appointment requests a patient sends from a clinic's page, for a
-- preferred day and time. Every doctor of that clinic sees them; doctor_id
-- is the doctor who handled the request. Completed appointments (with the
-- doctor's diagnosis and notes) make up the patient's visit history.
CREATE TABLE IF NOT EXISTS appointments (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id   INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    place_id     VARCHAR(80)  NOT NULL,                              -- clinic code
    doctor_id    INTEGER      REFERENCES users(id) ON DELETE SET NULL, -- who handled it
    day          DATE         NOT NULL,
    time         TIME         NOT NULL,
    reason       VARCHAR(300) NOT NULL,
    status       VARCHAR(10)  NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    diagnosis    VARCHAR(500),
    notes        TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_place_idx   ON appointments (place_id, day, time);
CREATE INDEX IF NOT EXISTS appointments_patient_idx ON appointments (patient_id, day DESC);
