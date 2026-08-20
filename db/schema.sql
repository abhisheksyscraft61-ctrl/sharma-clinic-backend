-- ============================================================
-- ClinicCare Backend - Database Schema (PostgreSQL)
-- ============================================================
-- Run this once against a fresh database:
--   psql -U postgres -d clinic_db -f db/schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- CLINICS  (both clinics belong to the same owner)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinics (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL,
    address     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- STAFF USERS  (login for the clinic-side app)
-- role: 'admin' can manage both clinics + staff accounts,
-- 'staff' can manage patients/visits.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'staff'
                  CHECK (role IN ('admin', 'staff')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- DOCTORS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(150) NOT NULL,
    specialization  VARCHAR(150),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- PATIENTS
-- A patient is NOT tied to one clinic - both clinics share the
-- same patient list. Which clinic they visited is recorded per-visit.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(150) NOT NULL,
    age               INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
    sex               VARCHAR(10) NOT NULL CHECK (sex IN ('male', 'female', 'other')),
    phone             VARCHAR(20) NOT NULL,
    address           TEXT,
    registration_no   VARCHAR(50) NOT NULL UNIQUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_name  ON patients (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients (phone);

-- ------------------------------------------------------------
-- PATIENT <-> DOCTOR  (many-to-many, max 3 doctors per patient
-- enforced in the application layer via a trigger below)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_doctors (
    patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id   UUID NOT NULL REFERENCES doctors(id)  ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (patient_id, doctor_id)
);

-- Enforce "max 3 doctors per patient" at the database level too,
-- so it's safe even if something bypasses the API validation.
CREATE OR REPLACE FUNCTION check_max_doctors_per_patient()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM patient_doctors WHERE patient_id = NEW.patient_id) >= 3 THEN
        RAISE EXCEPTION 'A patient can have at most 3 doctors assigned';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_max_doctors ON patient_doctors;
CREATE TRIGGER trg_max_doctors
    BEFORE INSERT ON patient_doctors
    FOR EACH ROW EXECUTE FUNCTION check_max_doctors_per_patient();

-- ------------------------------------------------------------
-- VISITS  (every time the patient comes in)
-- clinic_id lives HERE, not on patients, since the same patient
-- can visit either clinic on different dates.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visits (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id   UUID NOT NULL REFERENCES clinics(id),
    doctor_id   UUID REFERENCES doctors(id),
    visit_date  DATE NOT NULL,
    notes       TEXT,
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits (patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_clinic  ON visits (clinic_id);
CREATE INDEX IF NOT EXISTS idx_visits_date    ON visits (visit_date);

-- ------------------------------------------------------------
-- VISIT FILES  (prescription photo / PDF attachments)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visit_files (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id      UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    file_name     VARCHAR(255) NOT NULL,
    file_path     VARCHAR(500) NOT NULL,   -- path on disk / storage key
    file_type     VARCHAR(10)  NOT NULL CHECK (file_type IN ('image', 'pdf')),
    file_size     INTEGER,                 -- bytes
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_files_visit ON visit_files (visit_id);

-- ------------------------------------------------------------
-- Keep patients.updated_at fresh
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_patients_updated_at ON patients;
CREATE TRIGGER trg_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
