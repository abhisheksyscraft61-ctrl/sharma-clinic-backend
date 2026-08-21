const mysql = require('mysql2/promise');
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
});

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return { rows: Array.isArray(rows) ? rows : [], rowCount: rows.affectedRows ?? 0 };
}

async function getClient() {
  const connection = await pool.getConnection();
  return {
    query: async (sql, params = []) => {
      const [rows] = await connection.query(sql, params);
      return { rows: Array.isArray(rows) ? rows : [], rowCount: rows.affectedRows ?? 0 };
    },
    release: () => connection.release(),
  };
}

module.exports = { pool, query, getClient };