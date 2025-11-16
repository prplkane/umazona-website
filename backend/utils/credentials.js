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
