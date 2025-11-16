const fs = require('fs');
const path = require('path');

/**
 * Attempt to load service account credentials for Google Drive.
 * Supports either:
 *  - `GOOGLE_DRIVE_CREDENTIALS` (raw JSON or base64-encoded JSON), or
 *  - `GOOGLE_DRIVE_CREDENTIALS_PATH` (path to a JSON file)
 *
 * Returns the parsed credentials object, or null if none provided.
 */
function getCredentials() {
    const credentialsJson = process.env.GOOGLE_DRIVE_CREDENTIALS;
    const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH;

    // If an inline env var is provided, prefer it
    if (credentialsJson) {
        try {
            let credentials;
            try {
                credentials = JSON.parse(credentialsJson);
            } catch {
                // Try decoding from base64
                const decoded = Buffer.from(credentialsJson, 'base64').toString('utf-8');
                credentials = JSON.parse(decoded);
            }

            if (credentials && credentials.type && credentials.type === 'service_account') {
                return credentials;
            }

            throw new Error('Parsed credentials are not a Google service account JSON');
        } catch (error) {
            throw new Error(`Failed to parse GOOGLE_DRIVE_CREDENTIALS: ${error.message}`);
        }
    }

    // Next, try loading from a file path
    if (credentialsPath) {
        try {
            const absolute = path.isAbsolute(credentialsPath)
                ? credentialsPath
                : path.join(process.cwd(), credentialsPath);
            const raw = fs.readFileSync(absolute, 'utf-8');
            const credentials = JSON.parse(raw);
            if (credentials && credentials.type && credentials.type === 'service_account') {
                return credentials;
            }
            throw new Error('Credentials file is not a Google service account JSON');
        } catch (error) {
            throw new Error(`Failed to load GOOGLE_DRIVE_CREDENTIALS_PATH: ${error.message}`);
        }
    }

    // No service account credentials configured — return null so callers can fall back to OAuth2
    return null;
}

module.exports = {
    getCredentials,
};
