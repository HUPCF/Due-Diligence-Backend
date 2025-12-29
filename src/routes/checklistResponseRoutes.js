const express = require('express');
const router = express.Router();
const { createOrUpdateResponse, upload, getResponses, getUserResponses, updateResponse, deleteChecklistFile } = require('../controllers/checklistResponseController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.post('/', protect, upload.array('files', 10), createOrUpdateResponse);
router.get('/', protect, getResponses);
router.get('/user/:userId', protect, getUserResponses);
router.put('/:id', protect, updateResponse);
router.delete('/:responseId/file', protect, deleteChecklistFile);

module.exports = router;
