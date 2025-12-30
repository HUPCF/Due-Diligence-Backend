const express = require('express');
const router = express.Router();
const { upload, uploadDocument, getDocumentsByUserId, deleteDocument, downloadFile } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

// Upload a document for a specific user
router.post('/user/:userId/upload', upload.single('document'), uploadDocument);

// Get all documents for a specific user
router.get('/user/:userId', getDocumentsByUserId);

// Delete a specific document
router.delete('/:documentId', deleteDocument);

// Download a file (proxy from Bunny.net) - requires authentication
router.get('/download/:fileName', protect, downloadFile);

module.exports = router;
