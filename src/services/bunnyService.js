const axios = require('axios');

const uploadFileToBunny = async (fileBuffer, fileName) => {
  try {
    console.log('--- Reading Bunny.net credentials from .env ---');
    const storageZoneName = process.env.BUNNY_STORAGE_ZONE_NAME;
    const apiKey = process.env.BUNNY_API_KEY;
    const storageRegion = process.env.BUNNY_STORAGE_REGION || 'ny';
    const basePath = process.env.BUNNY_BASE_PATH;
    const pullZoneUrl = process.env.BUNNY_PULL_ZONE_URL;

    console.log(`BUNNY_STORAGE_ZONE_NAME: ${storageZoneName ? 'Loaded' : 'NOT FOUND'}`);
    console.log(`BUNNY_API_KEY: ${apiKey ? 'Loaded' : 'NOT FOUND'}`);
    console.log(`BUNNY_PULL_ZONE_URL: ${pullZoneUrl ? 'Loaded' : 'NOT FOUND'}`);
    console.log(`BUNNY_BASE_PATH: ${basePath}`);

    if (!storageZoneName || !apiKey || !pullZoneUrl) {
      throw new Error('Bunny.net credentials not configured correctly in .env. Please check BUNNY_STORAGE_ZONE_NAME, BUNNY_API_KEY, and BUNNY_PULL_ZONE_URL.');
    }

    // Construct the storage API URL based on region
    const regionMap = {
      'ny': 'ny.storage.bunnycdn.com',
      'la': 'la.storage.bunnycdn.com',
      'sg': 'sg.storage.bunnycdn.com',
      'de': 'de.storage.bunnycdn.com',
      'jh': 'jh.storage.bunnycdn.com'
    };
    
    const storageHost = regionMap[storageRegion] || 'ny.storage.bunnycdn.com';
    
    // Clean base path - remove leading/trailing slashes
    const cleanBasePath = basePath ? basePath.replace(/^\/+|\/+$/g, '') : '';
    // Construct the full path on Bunny.net
    const bunnyPath = cleanBasePath ? `${cleanBasePath}/${fileName}` : fileName;
    
    // Bunny.net Storage API URL format: https://{region}.storage.bunnycdn.com/{storageZoneName}/{path}
    // The path for the upload URL must be URL-encoded
    const uploadUrl = `https://${storageHost}/${storageZoneName}/${encodeURI(bunnyPath)}`;

    console.log(`=== Bunny.net Upload Details ===`);
    console.log(`Storage Zone: ${storageZoneName}`);
    console.log(`Region: ${storageRegion} (${storageHost})`);
    console.log(`Upload Path: ${bunnyPath}`);
    console.log(`Upload URL: ${uploadUrl}`);
    console.log(`File: ${fileName}`);
    console.log(`File size: ${fileBuffer.length} bytes`);

    const response = await axios.put(uploadUrl, fileBuffer, {
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/octet-stream'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000, // 60 second timeout for large files
      validateStatus: function (status) {
        // Accept 200, 201 as success
        return status >= 200 && status < 300;
      }
    });

    console.log(`Bunny.net response status: ${response.status}`);

    if (response.status === 201 || response.status === 200) {
      console.log(`✅ File ${fileName} uploaded to Bunny.net successfully!`);
      // Return just the filename, which will be stored in the DB
      return fileName;
    } else {
      throw new Error(`Bunny.net upload failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error uploading file to Bunny.net:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response status text:', error.response.statusText);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.request) {
      console.error('Request made but no response received');
      console.error('Request URL:', error.config?.url);
    }
    console.error('Full error:', error);
    throw error;
  }
};

const deleteFileFromBunny = async (fileName) => {
  try {
    const storageZoneName = process.env.BUNNY_STORAGE_ZONE_NAME;
    const apiKey = process.env.BUNNY_API_KEY;
    const storageRegion = process.env.BUNNY_STORAGE_REGION || 'ny';
    const basePath = process.env.BUNNY_BASE_PATH;

    if (!storageZoneName || !apiKey) {
      throw new Error('Bunny.net credentials not configured for deletion.');
    }

    const regionMap = {
      'ny': 'ny.storage.bunnycdn.com',
      'la': 'la.storage.bunnycdn.com',
      'sg': 'sg.storage.bunnycdn.com',
      'de': 'de.storage.bunnycdn.com',
      'jh': 'jh.storage.bunnycdn.com'
    };
    
    const storageHost = regionMap[storageRegion] || 'ny.storage.bunnycdn.com';
    
    const cleanBasePath = basePath ? basePath.replace(/^\/+|\/+$/g, '') : '';
    const bunnyPath = cleanBasePath ? `${cleanBasePath}/${fileName}` : fileName;
    const deleteUrl = `https://${storageHost}/${storageZoneName}/${encodeURI(bunnyPath)}`;

    console.log(`=== Bunny.net Delete Details ===`);
    console.log(`Delete URL: ${deleteUrl}`);

    const response = await axios.delete(deleteUrl, {
      headers: { 'AccessKey': apiKey },
      validateStatus: (status) => status >= 200 && status < 300, // Success on 200 OK
    });

    console.log(`✅ File ${fileName} deleted from Bunny.net successfully!`);
    return true;

  } catch (error) {
    // If the file doesn't exist (404), Bunny returns an error. We can choose to ignore this.
    if (error.response && error.response.status === 404) {
      console.warn(`File ${fileName} not found on Bunny.net, but proceeding with DB deletion.`);
      return true; // Still resolve successfully
    }
    console.error('❌ Error deleting file from Bunny.net:', error.message);
    // For other errors, we re-throw to stop the DB deletion
    throw error;
  }
};

module.exports = {
  uploadFileToBunny,
  deleteFileFromBunny,
};
