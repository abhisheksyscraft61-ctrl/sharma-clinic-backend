const { query, getClient } = require('../config/db');

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
    sql += ` WHERE p.id IN (SELECT patient_id FROM visits WHERE clinic_id = $${params.length})`;
  }

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    const clause = `(LOWER(p.name) LIKE $${params.length} OR p.phone LIKE $${params.length})`;
    sql += conditions.length || clinicId ? ` AND ${clause}` : ` WHERE ${clause}`;
  }

  sql += ' ORDER BY p.created_at DESC';

  const { rows } = await query(sql, params);
  return rows;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM patients WHERE id = $1', [id]);
  return rows[0];
}

async function findByRegistrationNo(registrationNo) {
  const { rows } = await query(
    'SELECT * FROM patients WHERE registration_no = $1',
    [registrationNo]
  );
  return rows[0];
}

async function create({ name, age, sex, phone, address, registrationNo }) {
  const { rows } = await query(
    `INSERT INTO patients (name, age, sex, phone, address, registration_no)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, age, sex, phone, address, registrationNo]
  );
  return rows[0];
}

async function update(id, { name, age, sex, phone, address, registrationNo }) {
  const { rows } = await query(
    `UPDATE patients SET
       name = COALESCE($2, name),
       age = COALESCE($3, age),
       sex = COALESCE($4, sex),
       phone = COALESCE($5, phone),
       address = COALESCE($6, address),
       registration_no = COALESCE($7, registration_no)
     WHERE id = $1 RETURNING *`,
    [id, name, age, sex, phone, address, registrationNo]
  );
  return rows[0];
}

async function remove(id) {
  const { rowCount } = await query('DELETE FROM patients WHERE id = $1', [id]);
  return rowCount > 0;
}

/** Doctors currently assigned to a patient. */
async function getDoctors(patientId) {
  const { rows } = await query(
    `SELECT d.* FROM doctors d
     JOIN patient_doctors pd ON pd.doctor_id = d.id
     WHERE pd.patient_id = $1
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
      'SELECT COUNT(*)::int AS count FROM patient_doctors WHERE patient_id = $1',
      [patientId]
    );
    if (countRows[0].count >= MAX_DOCTORS_PER_PATIENT) {
      const err = new Error('A patient can have at most 3 doctors assigned');
      err.statusCode = 400;
      throw err;
    }
    await client.query(
      `INSERT INTO patient_doctors (patient_id, doctor_id) VALUES ($1, $2)
       ON CONFLICT (patient_id, doctor_id) DO NOTHING`,
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
    'DELETE FROM patient_doctors WHERE patient_id = $1 AND doctor_id = $2',
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
