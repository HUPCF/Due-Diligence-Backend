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
    const [rows] = await db.execute(
      `SELECT
         u.id,
         u.email,
         u.password,
         u.role,
         u.company_id,
         c.name AS company_name
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.email = ?`,
      [email]
    );
    const user = rows[0];
    if (user) {
      console.log(`User.findByEmail(${email}) - Found user:`, {
        id: user.id,
        email: user.email,
        company_id: user.company_id,
        company_name: user.company_name,
        company_name_type: typeof user.company_name,
        company_name_value: user.company_name === null ? 'NULL' : user.company_name === undefined ? 'UNDEFINED' : user.company_name
      });
    } else {
      console.log(`User.findByEmail(${email}) - User not found`);
    }
    return user;
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
    const user = rows[0];
    if (user) {
      console.log(`User.findById(${id}) - Found user:`, {
        id: user.id,
        email: user.email,
        company_id: user.company_id,
        company_name: user.company_name,
        company_name_type: typeof user.company_name,
        company_name_value: user.company_name === null ? 'NULL' : user.company_name === undefined ? 'UNDEFINED' : user.company_name
      });
    } else {
      console.log(`User.findById(${id}) - User not found`);
    }
    return user;
  },
  findAll: async () => {
    const [rows] = await db.execute(
      `SELECT 
         u.id, 
         u.email, 
         u.role, 
         u.company_id,
         c.name AS company_name,
         CASE 
           WHEN EXISTS (SELECT 1 FROM user_responses WHERE user_id = u.id) 
           OR EXISTS (SELECT 1 FROM documents WHERE user_id = u.id)
           THEN 1 
           ELSE 0 
         END AS has_data
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
