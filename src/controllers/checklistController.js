const Checklist = require('../models/checklistModel');

const getCategories = async (req, res) => {
  try {
    const categories = await Checklist.findAllCategories();
    res.json(categories);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

const getItemsByCategory = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const items = await Checklist.findItemsByCategoryId(categoryId);
    res.json(items);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

const getItemById = async (req, res) => {
  const { itemId } = req.params;
  try {
    const item = await Checklist.findItemById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Checklist item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

const getAllItems = async (req, res) => {
  try {
    const items = await Checklist.findAllItems();
    res.json(items);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

module.exports = {
  getCategories,
  getItemsByCategory,
  getItemById,
  getAllItems,
  getAllItems
};
