const mysql = require('mysql2/promise');
require('dotenv').config({ override: true });

const host = process.env.DB_HOST === 'Local' ? 'localhost' : (process.env.DB_HOST || 'localhost');

const pool = mysql.createPool({
  host: host,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'kjsit_connect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
