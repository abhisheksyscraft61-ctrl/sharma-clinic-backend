-- ClinicCare MySQL schema
-- Create the database first: CREATE DATABASE clinic_db;

CREATE TABLE IF NOT EXISTS clinics (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role IN ('admin', 'staff'))
);

CREATE TABLE IF NOT EXISTS doctors (
    id CHAR(36) PRIMARY KEY,
    doctor_number INT UNIQUE,
    name VARCHAR(150) NOT NULL,
    specialization VARCHAR(150),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    sex VARCHAR(10) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    registration_no VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_patients_age CHECK (age >= 0 AND age <= 150),
    CONSTRAINT chk_patients_sex CHECK (sex IN ('male', 'female', 'other')),
    INDEX idx_patients_name (name),
    INDEX idx_patients_phone (phone)
);

CREATE TABLE IF NOT EXISTS patient_doctors (
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (patient_id, doctor_id),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS visits (
    id CHAR(36) PRIMARY KEY,
    patient_id CHAR(36) NOT NULL,
    clinic_id CHAR(36) NOT NULL,
    doctor_id CHAR(36),
    visit_date DATE NOT NULL,
    notes TEXT,
    created_by CHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_visits_patient (patient_id),
    INDEX idx_visits_clinic (clinic_id),
    INDEX idx_visits_date (visit_date)
);

CREATE TABLE IF NOT EXISTS visit_files (
    id CHAR(36) PRIMARY KEY,
    visit_id CHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    file_size INT,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_visit_files_type CHECK (file_type IN ('image', 'pdf')),
    FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
    INDEX idx_visit_files_visit (visit_id)
);

DELIMITER //
DROP TRIGGER IF EXISTS trg_max_doctors//
CREATE TRIGGER trg_max_doctors
BEFORE INSERT ON patient_doctors
FOR EACH ROW
BEGIN
    IF (SELECT COUNT(*) FROM patient_doctors WHERE patient_id = NEW.patient_id) >= 3 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A patient can have at most 3 doctors assigned';
    END IF;
END//
DELIMITER ;
