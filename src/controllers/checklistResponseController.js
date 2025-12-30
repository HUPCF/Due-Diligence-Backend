const ChecklistResponse = require('../models/checklistResponseModel');
const multer = require('multer');
const { uploadFileToBunny, deleteFileFromBunny } = require('../services/bunnyService');
const { generateSecureUrl } = require('../utils/bunnyUrl');
const User = require('../models/userModel'); // Import User model to get company_id if needed
const axios = require('axios');

// Use memory storage to avoid saving files to disk
const upload = multer({ storage: multer.memoryStorage() });

const createOrUpdateResponse = async (req, res) => {
  try {
    let userId;
    let companyId;

    // Determine target userId and companyId based on whether the authenticated user is an admin
    if (req.user && req.user.role === 'admin' && req.body.targetUserId && req.body.targetCompanyId) {
      userId = parseInt(req.body.targetUserId, 10);
      companyId = parseInt(req.body.targetCompanyId, 10);
      
      // Ensure the admin is not trying to update responses for a non-existent user/company
      // Further validation could be added here if needed, e.g., checking if targetUser belongs to a company the admin manages
    } else {
      // For regular users, or if admin is not specifying target, use their own credentials
      userId = req.user.id;
      companyId = req.user.company_id;
    }

    const { itemId, response } = req.body;
    
    console.log('=== CREATE/UPDATE RESPONSE REQUEST ===');
    console.log('Authenticated user:', { id: userId, company_id: companyId, email: req.user.email });
    console.log('Request body:', { itemId, response });
    console.log('Files:', req.files ? req.files.length : 0);
    
    if (!companyId) {
      console.error('User not associated with a company');
      return res.status(403).json({ message: 'User not associated with a company.' });
    }

    if (!itemId || !response) {
      console.error('Missing required fields:', { itemId, response });
      return res.status(400).json({ message: 'Item ID and Response are required.' });
    }

    console.log(`Creating/updating response for user ${userId}, company ${companyId}, item ${itemId}`);

  const files = req.files || [];
  let uploadedFileInfo = [];

  // 1. File Upload Logic
  if (files.length > 0) {
    try {
      console.log(`\n=== Starting file upload process for ${files.length} file(s) ===`);
      const uploadPromises = files.map(async (file) => {
        const originalName = file.originalname;
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFileName = `${Date.now()}_${sanitizedName}`;
        
        console.log(`Uploading file: ${originalName} as ${uniqueFileName}`);
        const storedFileName = await uploadFileToBunny(file.buffer, uniqueFileName);
        return { originalName, storedFileName };
      });

      uploadedFileInfo = await Promise.all(uploadPromises);
      console.log(`\n=== File upload process complete. ${uploadedFileInfo.length}/${files.length} files uploaded successfully ===\n`);
    } catch (uploadError) {
      console.error('--- BUNNYCDN UPLOAD ERROR ---', uploadError);
      return res.status(500).json({ message: 'Failed to upload files.', detailedError: uploadError.message });
    }
  }

    // 2. Database Logic
    const parsedItemId = parseInt(itemId, 10);

    if (isNaN(parsedItemId)) {
      return res.status(400).json({ message: 'Invalid Item ID.' });
    }

    // First, check if the current user already has a response for this item
    const existingUserResponse = await ChecklistResponse.findByUserIdAndItemId(userId, parsedItemId);
    
    // Also check if there's any response for this company/item (might be from another user)
    const existingCompanyResponse = await ChecklistResponse.findByCompanyIdAndItemId(companyId, parsedItemId);

    if (existingUserResponse) {
      // User already has a response - update it
      console.log(`Found existing response for current user:`, {
        id: existingUserResponse.id,
        userId: existingUserResponse.user_id,
        currentResponse: existingUserResponse.response,
        newResponse: response,
        companyId: companyId,
        itemId: parsedItemId
      });
      
      const currentFileInfo = existingUserResponse.file_paths || [];
      const updatedFileInfo = uploadedFileInfo.length > 0 
        ? [...currentFileInfo, ...uploadedFileInfo] 
        : currentFileInfo;

      // Only update if response changed or files were added
      const responseChanged = existingUserResponse.response !== response;
      const filesAdded = uploadedFileInfo.length > 0;
      
      if (responseChanged || filesAdded) {
        console.log(`Updating user's own response ${existingUserResponse.id}: response changed=${responseChanged}, files added=${filesAdded}`);
        const affectedRows = await ChecklistResponse.update(existingUserResponse.id, response, updatedFileInfo, companyId);
        
        if (affectedRows > 0) {
          console.log(`Response updated successfully for item ${parsedItemId}`);
          res.json({ 
            message: 'Response updated successfully', 
            file_paths: updatedFileInfo,
            id: existingUserResponse.id,
            userId: userId,
            itemId: parsedItemId,
            response: response
          });
        } else {
          console.error(`Failed to update response - no rows affected for item ${parsedItemId}, response ID: ${existingUserResponse.id}`);
          console.error(`Response details:`, existingUserResponse);
          res.status(500).json({ 
            message: 'Failed to update response. Please try again.',
            details: 'Update query did not affect any rows'
          });
        }
      } else {
        console.log(`No changes detected - response and files are the same`);
        res.json({ 
          message: 'Response unchanged', 
          file_paths: currentFileInfo,
          id: existingUserResponse.id,
          userId: userId,
          itemId: parsedItemId,
          response: response
        });
      }
    } else if (existingCompanyResponse) {
      // Another user in the same company already has a response for this item
      // Create a new response for the current user
      console.log(`Another user (${existingCompanyResponse.user_id}) already has a response for this item. Creating new response for user ${userId}`);
      const newResponseId = await ChecklistResponse.create(userId, parsedItemId, response, uploadedFileInfo, companyId);
      console.log(`New response created with ID: ${newResponseId}`);
      res.status(201).json({ 
        id: newResponseId, 
        userId: userId, 
        itemId: parsedItemId, 
        response, 
        file_paths: uploadedFileInfo 
      });
    } else {
      console.log(`Creating new response for item ${parsedItemId}`);
      const newResponseId = await ChecklistResponse.create(userId, parsedItemId, response, uploadedFileInfo, companyId);
      console.log(`New response created with ID: ${newResponseId}`);
      res.status(201).json({ id: newResponseId, userId: userId, itemId: parsedItemId, response, file_paths: uploadedFileInfo });
    }
  } catch (dbError) {
    console.error('--- DATABASE OPERATION ERROR ---');
    console.error('Error message:', dbError.message);
    console.error('Error stack:', dbError.stack);
    res.status(500).json({ message: 'A database error occurred.', detailedError: dbError.message });
  }
};

const getUserResponses = async (req, res) => {
  const { userId } = req.params; // userId to view, might be different from req.user.id
  
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

    const responses = await ChecklistResponse.findByCompanyId(companyIdToView);
    
    // For each response, generate secure URLs for the file paths
    const responsesWithSecureUrls = responses.map(response => {
      if (response.file_paths && Array.isArray(response.file_paths)) {
        const secureFilePaths = response.file_paths.map(fileInfo => {
          // fileInfo is now { originalName, storedFileName }
          return {
            originalName: fileInfo.originalName,
            storedFileName: fileInfo.storedFileName,
            secureUrl: generateSecureUrl(fileInfo.storedFileName) // Generate URL using storedFileName
          };
        });
        return { ...response, file_paths: secureFilePaths };
      }
      return response;
    });

    res.json(responsesWithSecureUrls);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error', detailedError: error.message });
  }
};

const getResponses = async (req, res) => {
  const { itemId } = req.query; // No userId in query, use authenticated user's company
  
  const companyId = req.user.company_id;
  if (!companyId) {
    return res.status(403).json({ message: 'User not associated with a company.' });
  }

  try {
    if (!itemId) {
      return res.status(400).json({ message: 'Item ID is required.' });
    }
    const parsedItemId = parseInt(itemId, 10);

    if (isNaN(parsedItemId)) {
      return res.status(400).json({ message: 'Invalid Item ID.' });
    }

    const response = await ChecklistResponse.findByCompanyIdAndItemId(companyId, parsedItemId);
    
    if (response && response.file_paths && Array.isArray(response.file_paths)) {
        response.file_paths = response.file_paths.map(fileInfo => {
          // fileInfo is now { originalName, storedFileName }
          return {
            originalName: fileInfo.originalName,
            storedFileName: fileInfo.storedFileName,
            secureUrl: generateSecureUrl(fileInfo.storedFileName)
          };
        });
    }

    res.json(response || {}); // Return empty object if no response found
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error', detailedError: error.message });
  }
};

const updateResponse = async (req, res) => {
  const { id } = req.params;
  const { response } = req.body;
  
  const companyId = req.user.company_id;
  if (!companyId) {
    return res.status(403).json({ message: 'User not associated with a company.' });
  }

  if (!response) {
    return res.status(400).json({ message: 'Response text is required.' });
  }

  try {
    const existingResponse = await ChecklistResponse.findById(id, companyId); // Pass companyId for security
    if (!existingResponse) {
      return res.status(404).json({ message: 'Response not found or does not belong to your company.' });
    }
    
    const currentFileInfo = existingResponse.file_paths || [];

    const affectedRows = await ChecklistResponse.update(id, response, currentFileInfo, companyId); 
    
    if (affectedRows > 0) {
      res.json({ message: 'Response updated successfully.' });
    }
    else {
      res.status(404).json({ message: 'Response not found or no changes made.' });
    }
  } catch (error) {
    console.error('Error updating checklist response:', error.message);
    res.status(500).json({ message: 'Server error', detailedError: error.message });
  }
};

const deleteChecklistFile = async (req, res) => {
  const { responseId } = req.params;
  const { storedFileName } = req.body; // The unique filename to delete

  const companyId = req.user.company_id;
  if (!companyId) {
    return res.status(403).json({ message: 'User not associated with a company.' });
  }

  if (!storedFileName) {
    return res.status(400).json({ message: 'File name to delete is required.' });
  }

  try {
    const response = await ChecklistResponse.findById(responseId, companyId); // Pass companyId for security
    if (!response) {
      return res.status(404).json({ message: 'Checklist response not found or does not belong to your company.' });
    }

    const fileToDelete = response.file_paths.find(file => file.storedFileName === storedFileName);
    if (!fileToDelete) {
      return res.status(404).json({ message: 'File not found in this response.' });
    }

    // 1. Delete from BunnyCDN
    await deleteFileFromBunny(fileToDelete.storedFileName);

    // 2. Update the database
    const updatedFilePaths = response.file_paths.filter(file => file.storedFileName !== storedFileName);
    await ChecklistResponse.update(responseId, response.response, updatedFilePaths, companyId); // Pass companyId

    res.json({ message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Error deleting checklist file:', error.message);
    res.status(500).json({ message: 'Server error while deleting file.', detailedError: error.message });
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

    // Generate secure URL for the file
    const secureUrl = generateSecureUrl(filePath, 3600); // 1 hour expiry
    
    if (secureUrl === '#bunny-config-error') {
      return res.status(500).json({ message: 'Bunny.net configuration error.' });
    }

    console.log(`Downloading file: ${filePath} from ${secureUrl}`);

    // Fetch the file from Bunny.net
    const response = await axios.get(secureUrl, {
      responseType: 'stream',
      timeout: 60000, // 60 second timeout
    });

    // Extract original filename from the stored filename (remove timestamp prefix if present)
    const originalFileName = filePath.includes('_') ? filePath.substring(filePath.indexOf('_') + 1) : filePath;

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalFileName)}"`);
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    
    // Stream the file to the client
    response.data.pipe(res);

  } catch (error) {
    console.error('Error downloading file:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    res.status(500).json({ 
      message: 'Failed to download file.', 
      error: error.message 
    });
  }
};

module.exports = {
  upload,
  createOrUpdateResponse,
  getResponses,
  getUserResponses,
  updateResponse,
  deleteChecklistFile,
  downloadFile
};


