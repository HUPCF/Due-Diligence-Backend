require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const createAdmin = async () => {
    let connection;
  try {
    // Use the same database configuration as the main app
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'due_diligence',
    };

    // Add port if specified
    if (process.env.DB_PORT) {
        dbConfig.port = parseInt(process.env.DB_PORT);
    }

    // Add SSL configuration for Vultr or if DB_SSL is true
    if (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('vultr'))) {
        dbConfig.ssl = { rejectUnauthorized: false };
    }

    connection = await mysql.createConnection(dbConfig);

    const email = 'admin@hupcfl.com';
    const password = 'Harmony@2026';
    const role = 'admin';

    // Check if admin already exists
    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      console.log('Admin user already exists.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await connection.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role]
    );

    console.log('Admin user created successfully.');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    if (connection) {
        await connection.end();
    }
  }
};

createAdmin();