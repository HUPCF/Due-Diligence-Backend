const db = require('../config/db');

const Company = {
  create: async (name) => {
    const [result] = await db.execute(
      'INSERT INTO companies (name) VALUES (?)',
      [name]
    );
    return result.insertId;
  },
  findAll: async () => {
    const [rows] = await db.execute('SELECT * FROM companies');
    return rows;
  },
  findById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM companies WHERE id = ?', [id]);
    return rows[0];
  },
  update: async (id, name) => {
    const [result] = await db.execute(
      'UPDATE companies SET name = ? WHERE id = ?',
      [name, id]
    );
    return result.affectedRows;
  },
  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM companies WHERE id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Company;
