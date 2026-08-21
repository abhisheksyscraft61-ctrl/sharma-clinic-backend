const { query } = require('../config/db');
const { randomUUID } = require('crypto');

async function findAll() {
  const { rows } = await query('SELECT * FROM doctors ORDER BY name');
  return rows;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM doctors WHERE id = ?', [id]);
  return rows[0];
}

async function create({ name, specialization }) {
  const id = randomUUID();
  await query(
    'INSERT INTO doctors (id, name, specialization) VALUES (?, ?, ?)',
    [id, name, specialization]
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

module.exports = { findAll, findById, create, update, remove };
