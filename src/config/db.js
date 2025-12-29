const mysql = require('mysql2');
require('dotenv').config();

// Vultr managed databases typically require SSL and a specific port
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT, // Default Vultr MySQL port
  ssl: process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('vultr') 
    ? { rejectUnauthorized: false } 
    : undefined, // Enable SSL for Vultr databases
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();
