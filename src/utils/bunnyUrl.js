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

  let decodedPathForSigning;
  let encodedPathForUrl;

  try {
    // If it's already a full URL, extract the pathname
    const parsedUrl = new URL(fileNameOrUrl);
    decodedPathForSigning = decodeURIComponent(parsedUrl.pathname);
    encodedPathForUrl = parsedUrl.pathname;
  } catch (e) {
    // If it's just a filename, construct the path with base path
    const basePath = process.env.BUNNY_BASE_PATH || '';
    const cleanBasePath = basePath.replace(/^\/+|\/+$/g, '');
    
    // Ensure the filename doesn't already include the base path
    let cleanFileName = fileNameOrUrl;
    if (cleanBasePath && fileNameOrUrl.startsWith(cleanBasePath + '/')) {
      cleanFileName = fileNameOrUrl.replace(new RegExp(`^${cleanBasePath}/`), '');
    }
    
    // Construct paths - Bunny.net expects the path to start with /
    decodedPathForSigning = cleanBasePath ? `/${cleanBasePath}/${cleanFileName}` : `/${cleanFileName}`;
    encodedPathForUrl = cleanBasePath ? `/${cleanBasePath}/${encodeURIComponent(cleanFileName)}` : `/${encodeURIComponent(cleanFileName)}`;
  }

  // Ensure path starts with / for Bunny.net
  if (!decodedPathForSigning.startsWith('/')) {
    decodedPathForSigning = '/' + decodedPathForSigning;
  }
  if (!encodedPathForUrl.startsWith('/')) {
    encodedPathForUrl = '/' + encodedPathForUrl;
  }

  // The expires timestamp for the signature
  const expires = Math.floor(Date.now() / 1000) + expiry;

  // Bunny.net token authentication: SecurityKey + Path + Expires
  // Path must be URL-decoded for signing
  const stringToSign = securityKey + decodedPathForSigning + expires;
  console.log(`String to sign: ${securityKey.substring(0, 4)}...${securityKey.substring(securityKey.length - 4)} + ${decodedPathForSigning} + ${expires}`);
  
  const hash = crypto.createHash('sha256').update(stringToSign, 'utf8').digest();
  
  let token = hash.toString('base64');
  // Bunny.net uses URL-safe base64: replace + with -, / with _, and remove =
  token = token.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const finalUrl = `https://${pullZoneUrl}${encodedPathForUrl}?token=${token}&expires=${expires}`;
  
  console.log(`Path for signing: ${decodedPathForSigning}`);
  console.log(`Encoded path for URL: ${encodedPathForUrl}`);
  console.log(`Expires: ${expires} (${new Date(expires * 1000).toISOString()})`);
  console.log(`Final Secure URL: ${finalUrl}`);

  return finalUrl;
}

module.exports = { generateSecureUrl };
