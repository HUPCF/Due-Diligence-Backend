const db = require('../config/db');

const Document = {
  _baseQuery: `
    SELECT
      d.id,
      d.user_id,
      d.file_name,
      d.file_path,
      d.created_at,
      u.company_id
    FROM documents d
    JOIN users u ON d.user_id = u.id
  `,

  create: async (userId, fileName, filePath, companyId) => {
    try {
      const [result] = await db.execute(
        'INSERT INTO documents (user_id, file_name, file_path, company_id) VALUES (?, ?, ?, ?)',
        [userId, fileName, filePath, companyId]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in Document.create:', error.message);
      throw error;
    }
  },

  findByCompanyId: async (companyId) => {
    try {
      const [rows] = await db.execute(
        `${Document._baseQuery} WHERE u.company_id = ?`,
        [companyId]
      );
      return rows;
    } catch (error) {
      console.error('Error in Document.findByCompanyId:', error.message);
      throw error;
    }
  },

  findById: async (documentId, companyId) => {
    try {
      const [rows] = await db.execute(
        `${Document._baseQuery} WHERE d.id = ? AND u.company_id = ?`,
        [documentId, companyId]
      );
      return rows[0];
    } catch (error) {
      console.error('Error in Document.findById:', error.message);
      throw error;
    }
  },

  delete: async (documentId, companyId) => {
    try {
      const [result] = await db.execute('DELETE FROM documents WHERE id = ? AND company_id = ?', [documentId, companyId]);
      return result.affectedRows;
    } catch (error) {
      console.error('Error in Document.delete:', error.message);
      throw error;
    }
  }
};

module.exports = Document;
