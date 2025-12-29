const Document = require('../models/documentModel');
const multer = require('multer');
const { uploadFileToBunny, deleteFileFromBunny } = require('../services/bunnyService');
const { generateSecureUrl } = require('../utils/bunnyUrl');
const User = require('../models/userModel'); // Import User model
const path = require('path');

// Configure Multer for file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Controller to handle document upload
const uploadDocument = async (req, res) => {
  const { userId } = req.params;

  // Ensure company_id is available from authenticated user
  const companyId = req.user.company_id;
  if (!companyId) {
    return res.status(403).json({ message: 'User not associated with a company.' });
  }

  // Parse and validate userId
  const parsedUserId = parseInt(userId, 10);

  if (isNaN(parsedUserId)) {
    return res.status(400).json({ message: 'Invalid User ID.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  try {
    // Sanitize and create a unique filename
    const originalName = req.file.originalname;
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${Date.now()}_${sanitizedName}`;

    // Upload to BunnyCDN from buffer with the new unique name
    const storedFileName = await uploadFileToBunny(req.file.buffer, uniqueFileName);

    // Save document details to the database, storing only the filename
    const documentId = await Document.create(parsedUserId, originalName, storedFileName, companyId);

    res.status(201).json({
      message: 'Document uploaded successfully.',
      document: { 
        id: documentId, 
        userId: parsedUserId, 
        fileName: originalName, // Send original name back to frontend
        file_path: storedFileName // Send stored name back to frontend
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error.message);
    res.status(500).json({ message: 'Failed to upload document.', detailedError: error.message });
  }
};

// Controller to get documents for a specific user
const getDocumentsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const parsedUserId = parseInt(userId, 10);
    if (isNaN(parsedUserId)) {
      return res.status(400).json({ message: 'Invalid User ID.' });
    }

    // Get the company_id of the user being viewed
    const viewedUser = await User.findById(parsedUserId);
    if (!viewedUser || !viewedUser.company_id) {
      return res.status(404).json({ message: 'Company not found for the specified user.' });
    }
    const companyIdToView = viewedUser.company_id;

    const documents = await Document.findByCompanyId(companyIdToView);
    
    // For each document, generate a secure, expiring URL for the frontend
    const documentsWithSecureUrls = documents.map(doc => {
      if (doc.file_path) {
        return {
          ...doc,
          // Replace file_path with a secure URL
          file_path: generateSecureUrl(doc.file_path)
        };
      }
      return doc;
    });

    console.log('--- Documents fetched for user', userId, '---');
    console.log(JSON.stringify(documentsWithSecureUrls, null, 2));
    
    res.json(documentsWithSecureUrls || []); // Return empty array if no documents found
  } catch (error) {
    console.error('Error fetching documents for user:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Failed to fetch documents.',
      detailedError: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Controller to delete a document
const deleteDocument = async (req, res) => {
  const { documentId } = req.params;
  
  const companyId = req.user.company_id;
  if (!companyId) {
    return res.status(403).json({ message: 'User not associated with a company.' });
  }

  try {
    // First, find the document to get the filename
    const document = await Document.findById(documentId, companyId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found or does not belong to your company.' });
    }

    // Delete the file from BunnyCDN
    if (document.file_path) {
      await deleteFileFromBunny(document.file_path);
    }

    // Then, delete the document from the database
    const affectedRows = await Document.delete(documentId, companyId);
    if (affectedRows > 0) {
      res.json({ message: 'Document deleted successfully.' });
    } else {
      res.status(404).json({ message: 'Document not found in database for deletion.' });
    }
  } catch (error) {
    console.error('Error deleting document:', error.message);
    res.status(500).json({ message: 'Failed to delete document.', detailedError: error.message });
  }
};


module.exports = {
  upload, // Multer middleware
  uploadDocument,
  getDocumentsByUserId,
  deleteDocument
};
