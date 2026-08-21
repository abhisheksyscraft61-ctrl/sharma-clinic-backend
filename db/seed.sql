-- ============================================================
-- Seed data - run AFTER schema.sql for local dev/testing
--   mysql -u root -p clinic_db < db/seed.sql
-- ============================================================

-- Password for both seeded users is: Password@123
-- (hash generated with bcryptjs, 10 salt rounds)
INSERT INTO users (id, name, email, password_hash, role) VALUES
('d1111111-1111-1111-1111-111111111111',
'Dr. Owner Admin', 'admin@cliniccare.com',
 '$2a$10$3euPcmQFCiblsZeEu5s7p.9wVsYh1F2p.o9tBUwPn6c1AXYcpH6Sq', 'admin'),
('d2222222-2222-2222-2222-222222222222', 'Front Desk Staff', 'staff@cliniccare.com',
 '$2a$10$3euPcmQFCiblsZeEu5s7p.9wVsYh1F2p.o9tBUwPn6c1AXYcpH6Sq', 'staff');

INSERT INTO clinics (id, name, address) VALUES
('11111111-1111-1111-1111-111111111111', 'Sunrise Clinic', 'MG Road, Indore'),
('22222222-2222-2222-2222-222222222222', 'City Care Clinic', 'Vijay Nagar, Indore');

INSERT INTO doctors (id, name, specialization) VALUES
('a1111111-1111-1111-1111-111111111111', 'Dr. R. Sharma', 'General Physician'),
('a2222222-2222-2222-2222-222222222222', 'Dr. A. Mehta', 'Orthopedic'),
('a3333333-3333-3333-3333-333333333333', 'Dr. S. Verma', 'Dermatologist'),
('a4444444-4444-4444-4444-444444444444', 'Dr. P. Nair', 'ENT Specialist');

INSERT INTO patients (id, name, age, sex, phone, address, registration_no) VALUES
('b1111111-1111-1111-1111-111111111111', 'Rahul Patidar', 34, 'male', '9876543210', '12, Shastri Nagar, Indore', 'REG-1001'),
('b2222222-2222-2222-2222-222222222222', 'Priya Patidar', 27, 'female', '9123456780', '45, Palasia, Indore', 'REG-1002');

INSERT INTO patient_doctors (patient_id, doctor_id) VALUES
('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
('b1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222'),
('b2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333');

INSERT INTO visits (id, patient_id, clinic_id, doctor_id, visit_date, notes) VALUES
('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111',
 '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
 '2026-08-02', 'Routine checkup, mild fever'),
('c2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111',
 '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222',
 '2026-07-10', 'Knee pain follow-up');
