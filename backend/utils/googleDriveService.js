const { google } = require('googleapis');
const { getCredentials } = require('./credentials');

// Cache to store authorization and drive instance
let driveInstance = null;
let authorizationDetails = null;

// Cache for folder discovery (TTL: 1 hour)
const folderCache = {
    data: null,
    timestamp: null,
    TTL: 60 * 60 * 1000, // 1 hour in milliseconds
};

/**
 * Initialize Google Drive API client
 * @returns {Promise<Object>} Google Drive API instance
 */
async function initializeDrive() {
    if (driveInstance) {
        return driveInstance;
    }

    try {
        // Support two authentication modes:
        // 1) Service Account: set GOOGLE_DRIVE_CREDENTIALS with the service account JSON (or base64 encoded)
        // 2) OAuth2 Refresh Token: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN

        // Mode 1: Service account credentials
        if (process.env.GOOGLE_DRIVE_CREDENTIALS) {
            const credentials = getCredentials();

            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
            });

            driveInstance = google.drive({
                version: 'v3',
                auth,
            });

            authorizationDetails = auth;
            console.log('Google Drive API initialized successfully (service account)');
            return driveInstance;
        }

        // Mode 2: OAuth2 with refresh token
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

        if (clientId && clientSecret && refreshToken) {
            const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
            oauth2Client.setCredentials({ refresh_token: refreshToken });

            driveInstance = google.drive({
                version: 'v3',
                auth: oauth2Client,
            });

            authorizationDetails = oauth2Client;
            console.log('Google Drive API initialized successfully (OAuth2 refresh token)');
            return driveInstance;
        }

        throw new Error('No Google credentials found. Set GOOGLE_DRIVE_CREDENTIALS (service account) or GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN (OAuth2).');
    } catch (error) {
        console.error('Error initializing Google Drive API:', error);
        throw error;
    }
}

/**
 * Get photos from a specific Google Drive folder
 * @param {string} folderId - Google Drive folder ID
 * @returns {Promise<Array>} Array of photo objects with metadata
 */
async function getPhotosFromFolder(folderId) {
    try {
        const drive = await initializeDrive();

        const response = await drive.files.list({
            q: `'${folderId}' in parents and mimeType contains 'image' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name, mimeType, createdTime, webViewLink, webContentLink)',
            pageSize: 100,
        });

        return response.data.files || [];
    } catch (error) {
        console.error('Error fetching photos from folder:', error);
        throw error;
    }
}

/**
 * Get photo metadata including thumbnail link
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<Object>} File metadata with thumbnail
 */
async function getPhotoMetadata(fileId) {
    try {
        const drive = await initializeDrive();

        const response = await drive.files.get({
            fileId,
            fields: 'id, name, mimeType, createdTime, webViewLink, webContentLink, thumbnailLink, size',
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching photo metadata:', error);
        throw error;
    }
}

/**
 * Get all photos for a specific game
 * @param {string} gameId - Game identifier
 * @param {Object} gameToFolderMap - Mapping of game IDs to Google Drive folder IDs
 * @returns {Promise<Array>} Array of photos for the game
 */
async function getPhotosByGame(gameId, gameToFolderMap) {
    try {
        const folderId = gameToFolderMap[gameId];

        if (!folderId) {
            console.warn(`No folder mapping found for game: ${gameId}`);
            return [];
        }

        const photos = await getPhotosFromFolder(folderId);
        return photos;
    } catch (error) {
        console.error(`Error fetching photos for game ${gameId}:`, error);
        throw error;
    }
}

/**
 * Discover all folders in Google Drive root
 * @returns {Promise<Array>} Array of folder objects {id, name}
 */
async function discoverGameFolders() {
    try {
        const drive = await initializeDrive();
        const now = Date.now();

        // Check if cache is still valid
        if (folderCache.data && folderCache.timestamp && (now - folderCache.timestamp) < folderCache.TTL) {
            console.log('Using cached folder list');
            return folderCache.data;
        }

        console.log('Scanning Google Drive for game folders...');

        const response = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
            spaces: 'drive',
            fields: 'files(id, name, createdTime, modifiedTime)',
            pageSize: 100,
        });

        const folders = response.data.files || [];

        // Cache the results
        folderCache.data = folders;
        folderCache.timestamp = now;

        console.log(`Found ${folders.length} folders in Google Drive`);
        return folders;
    } catch (error) {
        console.error('Error discovering folders:', error);
        throw error;
    }
}

/**
 * Find a folder by exact name match
 * @param {string} folderName - The exact name of the folder to find
 * @returns {Promise<Object|null>} Folder object {id, name} or null if not found
 */
async function findFolderByName(folderName) {
    try {
        const folders = await discoverGameFolders();
        const found = folders.find(f => f.name.toLowerCase() === folderName.toLowerCase());
        return found || null;
    } catch (error) {
        console.error(`Error finding folder by name '${folderName}':`, error);
        throw error;
    }
}

/**
 * Get a mapping of game names to folder IDs by auto-discovering folders
 * Looks for folders with game-like names (case-insensitive)
 * @param {Array<string>} gameNames - List of game names to look for (e.g., ['basketball', 'football'])
 * @returns {Promise<Object>} Object mapping game names to folder IDs
 */
async function autoMapGameFolders(gameNames) {
    try {
        const gameMap = {};
        const folders = await discoverGameFolders();

        for (const gameName of gameNames) {
            const found = folders.find(f => f.name.toLowerCase() === gameName.toLowerCase());
            if (found) {
                gameMap[gameName.toLowerCase()] = found.id;
                console.log(`✓ Found folder for ${gameName}: ${found.name} (${found.id})`);
            } else {
                console.warn(`✗ No folder found for game: ${gameName}`);
            }
        }

        return gameMap;
    } catch (error) {
        console.error('Error auto-mapping game folders:', error);
        throw error;
    }
}

/**
 * Clear the folder cache to force a refresh on next discovery
 */
function clearFolderCache() {
    folderCache.data = null;
    folderCache.timestamp = null;
    console.log('Folder cache cleared');
}

/**
 * Get cache status for debugging
 * @returns {Object} Cache information
 */
function getCacheStatus() {
    if (!folderCache.data) {
        return { cached: false, message: 'No cache available' };
    }

    const now = Date.now();
    const age = now - folderCache.timestamp;
    const isValid = age < folderCache.TTL;
    const ttlRemaining = Math.max(0, folderCache.TTL - age);

    return {
        cached: true,
        folderCount: folderCache.data.length,
        cacheAge: age,
        cacheValid: isValid,
        ttlRemaining,
        message: isValid ? `Cache valid for ${Math.ceil(ttlRemaining / 1000)}s more` : 'Cache expired'
    };
}

module.exports = {
    initializeDrive,
    getPhotosFromFolder,
    getPhotoMetadata,
    getPhotosByGame,
    discoverGameFolders,
    findFolderByName,
    autoMapGameFolders,
    clearFolderCache,
    getCacheStatus,
};
