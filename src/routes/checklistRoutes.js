const express = require('express');
const router = express.Router();
const { getCategories, getItemsByCategory, getItemById, getAllItems } = require('../controllers/checklistController');

router.get('/categories', getCategories);
router.get('/categories/:categoryId/items', getItemsByCategory);
router.get('/items/:itemId', getItemById);
router.get('/items', getAllItems);

module.exports = router;
