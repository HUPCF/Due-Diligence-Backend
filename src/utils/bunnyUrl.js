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
    const parsedUrl = new URL(fileNameOrUrl);
    decodedPathForSigning = decodeURI(parsedUrl.pathname);
    encodedPathForUrl = parsedUrl.pathname;
  } catch (e) {
    const basePath = process.env.BUNNY_BASE_PATH || '';
    const cleanBasePath = basePath.replace(/^\/+|\/+$/g, '');
    decodedPathForSigning = `/${cleanBasePath}/${fileNameOrUrl}`;
    encodedPathForUrl = `/${cleanBasePath}/${encodeURIComponent(fileNameOrUrl)}`;
  }

  // The expires timestamp for the signature
  const expires = Math.floor(Date.now() / 1000) + expiry;

  const stringToSign = securityKey + decodedPathForSigning + expires;
  const hash = crypto.createHash('sha256').update(stringToSign).digest();
  
  let token = hash.toString('base64');
  token = token.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const finalUrl = `https://${pullZoneUrl}${encodedPathForUrl}?token=${token}&expires=${expires}`;
  
  console.log(`Path for signing: ${decodedPathForSigning}`);
  console.log(`Final Secure URL: ${finalUrl}`);

  return finalUrl;
}

module.exports = { generateSecureUrl };
