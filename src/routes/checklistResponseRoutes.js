const express = require('express');
const router = express.Router();
const { createOrUpdateResponse, upload, getResponses, getUserResponses, updateResponse, deleteChecklistFile, downloadFile } = require('../controllers/checklistResponseController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
// IMPORTANT: More specific routes must come before generic ones
router.post('/', protect, upload.array('files', 10), createOrUpdateResponse);
router.get('/download/:fileName', protect, downloadFile); // Download route before generic routes
router.get('/user/:userId', protect, getUserResponses);
router.get('/', protect, getResponses);
router.put('/:id', protect, updateResponse);
router.delete('/:responseId/file', protect, deleteChecklistFile);

module.exports = router;
