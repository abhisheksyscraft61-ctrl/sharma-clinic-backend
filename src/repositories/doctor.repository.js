const { query } = require('../config/db');
const { randomUUID } = require('crypto');

async function findAll() {
  const { rows } = await query(
    'SELECT id, doctor_number AS doctorNumber, name, specialization, created_at FROM doctors ORDER BY doctor_number, name'
  );
  return rows;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM doctors WHERE id = ?', [id]);
  return rows[0];
}

async function findByNumber(doctorNumber) {
  const { rows } = await query('SELECT * FROM doctors WHERE doctor_number = ?', [doctorNumber]);
  return rows[0];
}

async function create({ name, specialization }) {
  const id = randomUUID();
  const { rows } = await query('SELECT COALESCE(MAX(doctor_number), 0) + 1 AS doctorNumber FROM doctors');
  await query(
    'INSERT INTO doctors (id, doctor_number, name, specialization) VALUES (?, ?, ?, ?)',
    [id, rows[0].doctorNumber, name, specialization]
  );
  return findById(id);
}

async function update(id, { name, specialization }) {
  const { rows } = await query(
    `UPDATE doctors SET name = COALESCE(?, name),
     specialization = COALESCE(?, specialization) WHERE id = ?`,
    [name, specialization, id]
  );
  return findById(id);
}

async function remove(id) {
  const { rowCount } = await query('DELETE FROM doctors WHERE id = ?', [id]);
  return rowCount > 0;
}

module.exports = { findAll, findById, findByNumber, create, update, remove };
