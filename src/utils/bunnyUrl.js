const crypto = require('crypto');
const url = require('url');

/**
 * Generates a secure, token-authenticated URL for a BunnyCDN file.
 * @param {string} fileNameOrUrl The name of the file or a full URL as stored in the DB.
 * @param {number} expiry The lifetime of the URL in seconds. Defaults to 3600 (1 hour).
 * @returns {string} The secure, temporary URL for the file.
 */
function generateSecureUrl(fileNameOrUrl, expiry = 3600) {
  console.log('--- Generating Secure URL ---');
  const pullZoneUrl = process.env.BUNNY_PULL_ZONE_URL;
  const securityKey = process.env.BUNNY_PULL_ZONE_SECURITY_KEY;
  
  if (!pullZoneUrl || !securityKey) {
    console.error('BUNNY_PULL_ZONE_URL and BUNNY_PULL_ZONE_SECURITY_KEY must be set in .env');
    return '#bunny-config-error';
  }

  let pathForSigning;

  try {
    // If the input is a full URL, extract its path.
    const parsedUrl = new URL(fileNameOrUrl);
    pathForSigning = decodeURI(parsedUrl.pathname);
  } catch (e) {
    // If it's not a URL, it's just a filename. Construct the path.
    const basePath = process.env.BUNNY_BASE_PATH || '';
    const cleanBasePath = basePath.replace(/^\/+|\/+$/g, '');
    pathForSigning = `/${cleanBasePath}/${fileNameOrUrl}`;
  }

  // The expires timestamp for the signature
  const expires = Math.floor(Date.now() / 1000) + expiry;

  const stringToSign = securityKey + pathForSigning + expires;
  const hash = crypto.createHash('sha256').update(stringToSign).digest();
  
  let token = hash.toString('base64');
  token = token.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  // The final URL must use a URL-encoded path
  const finalUrl = `https://${pullZoneUrl}${encodeURI(pathForSigning)}?token=${token}&expires=${expires}`;
  
  console.log(`Path for signing: ${pathForSigning}`);
  console.log(`Final Secure URL: ${finalUrl}`);

  return finalUrl;
}

module.exports = { generateSecureUrl };
