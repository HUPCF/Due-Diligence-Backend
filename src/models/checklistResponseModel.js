const db = require('../config/db');

const ChecklistResponse = {
  _baseQuery: `
    SELECT 
      ur.id, 
      ur.user_id, 
      ur.item_id, 
      ur.response, 
      ur.file_paths, 
      ur.created_at, 
      ur.updated_at,
      u.company_id,
      u.email as responder_email
    FROM user_responses ur
    JOIN users u ON ur.user_id = u.id
  `,

  create: async (userId, itemId, response, filePaths, companyId) => {
    try {
      const filePathsJson = JSON.stringify(filePaths || []);
      const [result] = await db.execute(
        'INSERT INTO user_responses (user_id, item_id, response, file_paths, company_id) VALUES (?, ?, ?, ?, ?)',
        [userId, itemId, response, filePathsJson, companyId]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in ChecklistResponse.create:', error.message);
      throw error;
    }
  },

  findByCompanyId: async (companyId) => {
    try {
      const [rows] = await db.execute(
        `${ChecklistResponse._baseQuery} WHERE u.company_id = ?`,
        [companyId]
      );
      return rows.map(row => {
        let filePaths = [];
        if (row.file_paths) {
          try {
            filePaths = JSON.parse(row.file_paths);
          } catch (e) {
            filePaths = [];
          }
        }
        return {
          ...row,
          file_paths: filePaths
        };
      });
    } catch (error) {
      console.error('Error in ChecklistResponse.findByCompanyId:', error.message);
      throw error;
    }
  },

  findByCompanyIdAndItemId: async (companyId, itemId) => {
    try {
      const [rows] = await db.execute(
        `${ChecklistResponse._baseQuery} WHERE u.company_id = ? AND ur.item_id = ?`,
        [companyId, itemId]
      );
      if (rows[0]) {
        let filePaths = [];
        if (rows[0].file_paths) {
          try {
            filePaths = JSON.parse(rows[0].file_paths);
          } catch (e) {
            filePaths = [];
          }
        }
        return {
          ...rows[0],
          file_paths: filePaths
        };
      }
      return null;
    } catch (error) {
      console.error('Error in ChecklistResponse.findByCompanyIdAndItemId:', error.message);
      throw error;
    }
  },

  // Find response by specific user and item (for checking if current user has a response)
  findByUserIdAndItemId: async (userId, itemId) => {
    try {
      const [rows] = await db.execute(
        `${ChecklistResponse._baseQuery} WHERE ur.user_id = ? AND ur.item_id = ?`,
        [userId, itemId]
      );
      if (rows[0]) {
        let filePaths = [];
        if (rows[0].file_paths) {
          try {
            filePaths = JSON.parse(rows[0].file_paths);
          } catch (e) {
            filePaths = [];
          }
        }
        return {
          ...rows[0],
          file_paths: filePaths
        };
      }
      return null;
    } catch (error) {
      console.error('Error in ChecklistResponse.findByUserIdAndItemId:', error.message);
      throw error;
    }
  },

  // Alias for controller calls, now company-based
  findByUserAndItem: async (userId, itemId) => {
    // This will still be called with userId from req.user for current implementation.
    // It should fetch company_id first, then query by companyId and itemId.
    // For now, let's keep it as is, but we'll adapt in controller.
    // However, if we're truly company-based, this alias should perhaps be removed or modified.
    // Let's change this to directly use companyId from the user object in the controller.
    console.warn("findByUserAndItem in model should ideally be replaced with company-based query in controller.");
    // This method will actually just call findByCompanyIdAndItemId
    const [userRow] = await db.execute('SELECT company_id FROM users WHERE id = ?', [userId]);
    if (!userRow[0]) return null;
    return ChecklistResponse.findByCompanyIdAndItemId(userRow[0].company_id, itemId);
  },

  update: async (id, response, filePaths, companyId) => {
    try {
      const filePathsJson = JSON.stringify(filePaths || []);
      
      // First, verify the response exists and belongs to the company
      // We'll use a JOIN to check company_id from users table (more reliable)
      const [verifyRows] = await db.execute(
        `SELECT ur.id FROM user_responses ur 
         JOIN users u ON ur.user_id = u.id 
         WHERE ur.id = ? AND u.company_id = ?`,
        [id, companyId]
      );
      
      if (verifyRows.length === 0) {
        console.error(`Response ${id} not found or doesn't belong to company ${companyId}`);
        return 0;
      }
      
      // Update the response - we can update by ID since we've verified company_id
      const [result] = await db.execute(
        'UPDATE user_responses SET response = ?, file_paths = ? WHERE id = ?',
        [response, filePathsJson, id]
      );
      
      console.log(`Update query executed: affectedRows = ${result.affectedRows}, id = ${id}, response = ${response}`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error in ChecklistResponse.update:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  },

  findById: async (id, companyId) => {
    try {
      const [rows] = await db.execute(
        `${ChecklistResponse._baseQuery} WHERE ur.id = ? AND u.company_id = ?`,
        [id, companyId]
      );
      if (rows[0]) {
        let filePaths = [];
        if (rows[0].file_paths) {
          try {
            filePaths = JSON.parse(rows[0].file_paths);
          } catch (e) {
            filePaths = [];
          }
        }
        return {
          ...rows[0],
          file_paths: filePaths
        };
      }
      return null;
    } catch (error) {
      console.error('Error in ChecklistResponse.findById:', error.message);
      throw error;
    }
  }
};

module.exports = ChecklistResponse;
