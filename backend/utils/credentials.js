/**
 * Google Drive Credentials Configuration
 * 
 * This module handles credentials for Google Drive API access.
 * 
 * Setup Instructions:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com/)
 * 2. Create a new project or select an existing one
 * 3. Enable the Google Drive API
 * 4. Create a Service Account:
 *    - Go to "Service Accounts" in the IAM & Admin section
 *    - Click "Create Service Account"
 *    - Fill in the account details
 *    - Grant it the "Editor" role (or create a custom role with Drive access)
 * 5. Create and download a JSON key for the service account
 * 6. Add the service account email to your Google Drive folders with appropriate permissions
 * 7. Store the JSON key content as an environment variable GOOGLE_DRIVE_CREDENTIALS
 * 
 * Environment Variable Format:
 * Set GOOGLE_DRIVE_CREDENTIALS to the full JSON content from the downloaded key file
 * Or store it as a Base64 encoded string and decode it here
 */

function getCredentials() {
    const credentialsJson = process.env.GOOGLE_DRIVE_CREDENTIALS;

    if (!credentialsJson) {
        throw new Error(
            'GOOGLE_DRIVE_CREDENTIALS environment variable is not set. ' +
            'Please configure your Google Drive API credentials.'
        );
    }

    try {
        // If credentials are base64 encoded, decode them
        let credentials;
        try {
            credentials = JSON.parse(credentialsJson);
        } catch {
            // Try decoding from base64
            const decoded = Buffer.from(credentialsJson, 'base64').toString('utf-8');
            credentials = JSON.parse(decoded);
        }

        // Validate that it's a service account credentials file
        if (credentials.type !== 'service_account') {
            throw new Error('Credentials must be from a Google Service Account');
        }

        return credentials;
    } catch (error) {
        throw new Error(`Failed to parse GOOGLE_DRIVE_CREDENTIALS: ${error.message}`);
    }
}

module.exports = {
    getCredentials,
};
