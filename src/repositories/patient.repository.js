const { query, getClient } = require('../config/db');
const { randomUUID } = require('crypto');

const MAX_DOCTORS_PER_PATIENT = 3;

/**
 * List patients with optional search (name/phone) and optional clinic
 * filter (patients who have at least one visit at that clinic).
 * Includes each patient's assigned doctors and a lightweight visit summary.
 */
async function findAll({ search, clinicId } = {}) {
  const params = [];
  const conditions = [];

  let sql = `
    SELECT p.*,
      (SELECT COUNT(*) FROM visits v WHERE v.patient_id = p.id) AS visit_count,
      (SELECT MAX(v.visit_date) FROM visits v WHERE v.patient_id = p.id) AS last_visit_date
    FROM patients p
  `;

  if (clinicId) {
    params.push(clinicId);
    sql += ' WHERE p.id IN (SELECT patient_id FROM visits WHERE clinic_id = ?)';
  }

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    params.push(`%${search.toLowerCase()}%`);
    const clause = '(LOWER(p.name) LIKE ? OR p.phone LIKE ?)';
    params.push(params[params.length - 1]);
    sql += conditions.length || clinicId ? ` AND ${clause}` : ` WHERE ${clause}`;
  }

  sql += ' ORDER BY p.created_at DESC';

  const { rows } = await query(sql, params);
  return rows;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM patients WHERE id = ?', [id]);
  return rows[0];
}

async function findByRegistrationNo(registrationNo) {
  const { rows } = await query(
    'SELECT * FROM patients WHERE registration_no = ?',
    [registrationNo]
  );
  return rows[0];
}

async function create({ name, age, sex, phone, address, registrationNo }) {
  await query(
    `INSERT INTO patients (id, name, age, sex, phone, address, registration_no)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [randomUUID(), name, age, sex, phone, address, registrationNo]
  );
  const { rows } = await query('SELECT * FROM patients WHERE registration_no = ?', [registrationNo]);
  return rows[0];
}

async function update(id, { name, age, sex, phone, address, registrationNo }) {
  const { rows } = await query(
    `UPDATE patients SET
       name = COALESCE(?, name),
       age = COALESCE(?, age),
       sex = COALESCE(?, sex),
       phone = COALESCE(?, phone),
       address = COALESCE(?, address),
       registration_no = COALESCE(?, registration_no)
     WHERE id = ?`,
    [name, age, sex, phone, address, registrationNo, id]
  );
  return findById(id);
}

async function remove(id) {
  const { rowCount } = await query('DELETE FROM patients WHERE id = ?', [id]);
  return rowCount > 0;
}

/** Doctors currently assigned to a patient. */
async function getDoctors(patientId) {
  const { rows } = await query(
    `SELECT d.* FROM doctors d
     JOIN patient_doctors pd ON pd.doctor_id = d.id
    WHERE pd.patient_id = ?
     ORDER BY pd.assigned_at`,
    [patientId]
  );
  return rows;
}

/** Assigns a doctor to a patient. Throws if already at the 3-doctor cap
 *  (also enforced by a DB trigger as a safety net). */
async function assignDoctor(patientId, doctorId) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { rows: countRows } = await client.query(
      'SELECT COUNT(*) AS count FROM patient_doctors WHERE patient_id = ?',
      [patientId]
    );
    if (countRows[0].count >= MAX_DOCTORS_PER_PATIENT) {
      const err = new Error('A patient can have at most 3 doctors assigned');
      err.statusCode = 400;
      throw err;
    }
    await client.query(
      `INSERT IGNORE INTO patient_doctors (patient_id, doctor_id) VALUES (?, ?)`,
      [patientId, doctorId]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function unassignDoctor(patientId, doctorId) {
  const { rowCount } = await query(
    'DELETE FROM patient_doctors WHERE patient_id = ? AND doctor_id = ?',
    [patientId, doctorId]
  );
  return rowCount > 0;
}

module.exports = {
  MAX_DOCTORS_PER_PATIENT,
  findAll,
  findById,
  findByRegistrationNo,
  create,
  update,
  remove,
  getDoctors,
  assignDoctor,
  unassignDoctor,
};
