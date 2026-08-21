const { query } = require('../config/db');
const { randomUUID } = require('crypto');

async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
}

async function findById(id) {
  const { rows } = await query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
}

async function create({ name, email, passwordHash, role }) {
  await query(
    `INSERT INTO users (id, name, email, password_hash, role)
     VALUES (?, ?, ?, ?, ?)`,
    [randomUUID(), name, email, passwordHash, role || 'staff']
  );
  const { rows } = await query(
    'SELECT id, name, email, role, created_at FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
}

module.exports = { findByEmail, findById, create };
