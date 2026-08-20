const { query } = require('../config/db');

async function findAll() {
  const { rows } = await query('SELECT * FROM doctors ORDER BY name');
  return rows;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM doctors WHERE id = $1', [id]);
  return rows[0];
}

async function create({ name, specialization }) {
  const { rows } = await query(
    'INSERT INTO doctors (name, specialization) VALUES ($1, $2) RETURNING *',
    [name, specialization]
  );
  return rows[0];
}

async function update(id, { name, specialization }) {
  const { rows } = await query(
    `UPDATE doctors SET name = COALESCE($2, name),
     specialization = COALESCE($3, specialization) WHERE id = $1 RETURNING *`,
    [id, name, specialization]
  );
  return rows[0];
}

async function remove(id) {
  const { rowCount } = await query('DELETE FROM doctors WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { findAll, findById, create, update, remove };
