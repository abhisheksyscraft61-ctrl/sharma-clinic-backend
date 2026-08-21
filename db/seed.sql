-- Minimal seed data for local development.
-- WARNING: cleanup removes existing demo/application data before seeding.

DELETE FROM visit_files;
DELETE FROM visits;
DELETE FROM patient_doctors;
DELETE FROM patients;
DELETE FROM doctors;
DELETE FROM clinics;
DELETE FROM users;

-- Password: Password@123
INSERT INTO users (id, name, email, password_hash, role) VALUES
('d1111111-1111-4111-8111-111111111111', 'Shikha Sharma', 'admin@cliniccare.com',
 '$2a$10$V8pifK8FwBRO1WIabbYIDOoYRMOMrrevYzGUfESMm0S.9ngkBGGsa', 'admin'),
('d2222222-2222-4222-8222-222222222222', 'Dr. A. Mehta', 'amehta@cliniccare.com',
 '$2a$10$V8pifK8FwBRO1WIabbYIDOoYRMOMrrevYzGUfESMm0S.9ngkBGGsa', 'staff'),
('d3333333-3333-4333-8333-333333333333', 'Dr. P. Nair', 'pnair@cliniccare.com',
 '$2a$10$V8pifK8FwBRO1WIabbYIDOoYRMOMrrevYzGUfESMm0S.9ngkBGGsa', 'staff'),
('d4444444-4444-4444-8444-444444444444', 'Dr. R. Sharma', 'rsharma@cliniccare.com',
 '$2a$10$V8pifK8FwBRO1WIabbYIDOoYRMOMrrevYzGUfESMm0S.9ngkBGGsa', 'staff'),
('d5555555-5555-4555-8555-555555555555', 'Dr. S. Verma', 'sverma@cliniccare.com',
 '$2a$10$V8pifK8FwBRO1WIabbYIDOoYRMOMrrevYzGUfESMm0S.9ngkBGGsa', 'staff');

INSERT INTO clinics (id, name, address) VALUES
('c1111111-1111-4111-8111-111111111111', 'Vijay Nagar', 'Vijay Nagar'),
('c2222222-2222-4222-8222-222222222222', 'Geeta Bhawan', 'Geeta Bhawan');

INSERT INTO doctors (id, doctor_number, name, specialization) VALUES
('a2222222-2222-2222-2222-222222222222', 1, 'Dr. A. Mehta', 'Orthopedic'),
('a4444444-4444-4444-4444-444444444444', 2, 'Dr. P. Nair', 'ENT Specialist'),
('a1111111-1111-1111-1111-111111111111', 3, 'Dr. R. Sharma', 'General Physician'),
('a3333333-3333-3333-3333-333333333333', 4, 'Dr. S. Verma', 'Dermatologist');
