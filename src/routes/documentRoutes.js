const express = require('express');
const router = express.Router();
const { upload, uploadDocument, getDocumentsByUserId, deleteDocument } = require('../controllers/documentController');

// Upload a document for a specific user
router.post('/user/:userId/upload', upload.single('document'), uploadDocument);

// Get all documents for a specific user
router.get('/user/:userId', getDocumentsByUserId);

// Delete a specific document
router.delete('/:documentId', deleteDocument);

module.exports = router;
