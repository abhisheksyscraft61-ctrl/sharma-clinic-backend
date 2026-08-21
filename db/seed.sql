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
 '$2a$10$V8pifK8FwBRO1WIabbYIDOoYRMOMrrevYzGUfESMm0S.9ngkBGGsa', 'admin');

INSERT INTO doctors (id, doctor_number, name, specialization) VALUES
('a1111111-1111-4111-8111-111111111111', 1, 'Dr. Amit Sharma', 'Junior Doctor'),
('a2222222-2222-4222-8222-222222222222', 2, 'Dr. Neha Verma', 'Junior Doctor'),
('a3333333-3333-4333-8333-333333333333', 3, 'Dr. Rahul Mehta', 'Junior Doctor');
