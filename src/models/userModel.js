const db = require('../config/db');

const User = {
  create: async (email, password, role, companyId) => {
    const [result] = await db.execute(
      'INSERT INTO users (email, password, role, company_id) VALUES (?, ?, ?, ?)',
      [email, password, role, companyId]
    );
    return result.insertId;
  },
  findByEmail: async (email) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },
  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT
         u.id,
         u.email,
         u.role,
         u.company_id,
         c.name AS company_name
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.id = ?`,
      [id]
    );
    return rows[0];
  },
  findAll: async () => {
    const [rows] = await db.execute(
      `SELECT 
         u.id, 
         u.email, 
         u.role, 
         u.company_id,
         c.name AS company_name
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id`
    );
    return rows;
  },
  updatePassword: async (id, password) => {
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [password, id]);
    return true;
  },
  delete: async (id) => {
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    return true;
  },
};

module.exports = User;
