const db = require('../config/db');

const Checklist = {
  findAllCategories: async () => {
    const [rows] = await db.execute('SELECT * FROM checklist_categories');
    return rows;
  },
  findItemsByCategoryId: async (categoryId) => {
    const [rows] = await db.execute('SELECT * FROM checklist_items WHERE category_id = ?', [categoryId]);
    return rows;
  },
  findItemById: async (itemId) => {
    const [rows] = await db.execute('SELECT * FROM checklist_items WHERE id = ?', [itemId]);
    return rows[0];
  },
  findAllItems: async () => {
    const [rows] = await db.execute(`
      SELECT ci.id, ci.category_id, ci.text, cc.name AS category_name
      FROM checklist_items ci
      JOIN checklist_categories cc ON ci.category_id = cc.id
    `);
    return rows;
  }
};

module.exports = Checklist;
