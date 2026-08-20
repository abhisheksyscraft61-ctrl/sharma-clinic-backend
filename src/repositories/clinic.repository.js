const { query } = require('../config/db');

async function findAll() {
  const { rows } = await query('SELECT * FROM clinics ORDER BY name');
  return rows;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM clinics WHERE id = $1', [id]);
  return rows[0];
}

async function create({ name, address }) {
  const { rows } = await query(
    'INSERT INTO clinics (name, address) VALUES ($1, $2) RETURNING *',
    [name, address]
  );
  return rows[0];
}

async function update(id, { name, address }) {
  const { rows } = await query(
    `UPDATE clinics SET name = COALESCE($2, name), address = COALESCE($3, address)
     WHERE id = $1 RETURNING *`,
    [id, name, address]
  );
  return rows[0];
}

async function remove(id) {
  const { rowCount } = await query('DELETE FROM clinics WHERE id = $1', [id]);
  return rowCount > 0;
}

/** Patient count + visit count for the clinic dashboard cards. */
async function statsById(id) {
  const { rows } = await query(
    `SELECT
        (SELECT COUNT(DISTINCT patient_id) FROM visits WHERE clinic_id = $1) AS patient_count,
        (SELECT COUNT(*) FROM visits WHERE clinic_id = $1) AS visit_count`,
    [id]
  );
  return rows[0];
}

module.exports = { findAll, findById, create, update, remove, statsById };
