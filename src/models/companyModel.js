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
    const [rows] = await db.execute(
      `SELECT
         c.id,
         c.name,
         COUNT(DISTINCT u.id) AS user_count,
         COUNT(DISTINCT ur.id) AS user_response_count,
         COUNT(DISTINCT d.id) AS document_count
       FROM companies c
       LEFT JOIN users u ON c.id = u.company_id
       LEFT JOIN user_responses ur ON c.id = ur.company_id
       LEFT JOIN documents d ON c.id = d.company_id
       GROUP BY c.id, c.name`
    );
    // Convert BigInt counts to numbers (MySQL returns COUNT as BigInt)
    return rows.map(row => ({
      ...row,
      user_count: Number(row.user_count),
      user_response_count: Number(row.user_response_count),
      document_count: Number(row.document_count)
    }));
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
