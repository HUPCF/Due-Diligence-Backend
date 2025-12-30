const Document = require('../models/documentModel');
const multer = require('multer');
const { uploadFileToBunny, deleteFileFromBunny, downloadFileFromBunny } = require('../services/bunnyService');
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
    
    // For each document, keep the stored filename and add a secure URL
    const documentsWithSecureUrls = documents.map(doc => {
      if (doc.file_path) {
        return {
          ...doc,
          storedFileName: doc.file_path, // Keep the stored filename for download endpoint
          file_path: generateSecureUrl(doc.file_path) // Keep secure URL for backward compatibility
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


// Controller to download a file from Bunny.net
const downloadFile = async (req, res) => {
  try {
    let { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({ message: 'File name is required.' });
    }

    // Decode the filename
    fileName = decodeURIComponent(fileName);

    // If it's a full URL, extract just the filename/path
    let filePath = fileName;
    try {
      const url = new URL(fileName);
      // Extract pathname and remove leading slash
      filePath = url.pathname.substring(1);
    } catch (e) {
      // Not a URL, use as-is
      filePath = fileName;
    }

    // Remove base path if it's already included (to avoid double-adding)
    const basePath = process.env.BUNNY_BASE_PATH || '';
    const cleanBasePath = basePath.replace(/^\/+|\/+$/g, '');
    if (cleanBasePath && filePath.startsWith(cleanBasePath + '/')) {
      filePath = filePath.substring(cleanBasePath.length + 1);
    }

    console.log(`Processing download - fileName: ${fileName}, filePath: ${filePath}, basePath: ${cleanBasePath}`);

    // Use Storage API to download file directly (more reliable than Pull Zone for server-side)
    console.log(`Downloading file: ${filePath} from Bunny.net Storage API`);

    // Download file stream from Bunny.net Storage API
    const fileStream = await downloadFileFromBunny(filePath);

    // Extract original filename from the stored filename (remove timestamp prefix if present)
    const originalFileName = filePath.includes('_') ? filePath.substring(filePath.indexOf('_') + 1) : filePath;

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalFileName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream'); // Generic binary type
    
    // Stream the file to the client
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading file:', error.message);
    console.error('Error stack:', error.stack);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      
      // If it's a 403 or 404, the file might not exist
      if (error.response.status === 403 || error.response.status === 404) {
        let errorBody = 'Unable to read error body';
        try {
          if (error.response.data && typeof error.response.data === 'string') {
            errorBody = error.response.data.substring(0, 500);
          } else if (error.response.data) {
            errorBody = JSON.stringify(error.response.data).substring(0, 500);
          }
        } catch (e) {
          console.error('Could not read error response body');
        }
        console.error(`${error.response.status} response body:`, errorBody);
        return res.status(error.response.status).json({ 
          message: `File not found or access denied. The file may not exist in Bunny.net Storage.`, 
          error: `Bunny.net Storage API returned ${error.response.status}`,
          details: errorBody
        });
      }
      
      return res.status(error.response.status).json({ 
        message: 'Failed to download file from Bunny.net.', 
        error: error.message,
        status: error.response.status
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to download file.', 
      error: error.message 
    });
  }
};

module.exports = {
  upload, // Multer middleware
  uploadDocument,
  getDocumentsByUserId,
  deleteDocument,
  downloadFile
};
