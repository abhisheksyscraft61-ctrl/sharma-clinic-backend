const { query } = require('../config/db');
const { randomUUID } = require('crypto');

async function findAll() {
  const { rows } = await query('SELECT * FROM clinics ORDER BY name');
  return rows;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM clinics WHERE id = ?', [id]);
  return rows[0];
}

async function create({ name, address }) {
  const id = randomUUID();
  await query(
    'INSERT INTO clinics (id, name, address) VALUES (?, ?, ?)',
    [id, name, address]
  );
  return findById(id);
}

async function update(id, { name, address }) {
  const { rows } = await query(
    `UPDATE clinics SET name = COALESCE(?, name), address = COALESCE(?, address)
     WHERE id = ?`,
    [name, address, id]
  );
  return findById(id);
}

async function remove(id) {
  const { rowCount } = await query('DELETE FROM clinics WHERE id = ?', [id]);
  return rowCount > 0;
}

/** Patient count + visit count for the clinic dashboard cards. */
async function statsById(id) {
  const { rows } = await query(
    `SELECT
        (SELECT COUNT(DISTINCT patient_id) FROM visits WHERE clinic_id = ?) AS patient_count,
        (SELECT COUNT(*) FROM visits WHERE clinic_id = ?) AS visit_count`,
      [id, id]
  );
  return rows[0];
}

module.exports = { findAll, findById, create, update, remove, statsById };
