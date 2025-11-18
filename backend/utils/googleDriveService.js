const { google } = require('googleapis');
const { getCredentials } = require('./credentials');
const fs = require('fs');
const path = require('path');

// Cache to store authorization and drive instance
let driveInstance = null;
let authorizationDetails = null;

// Cache for folder discovery (TTL: 1 hour)
const folderCache = {
    data: null,
    timestamp: null,
    TTL: 60 * 60 * 1000, // 1 hour in milliseconds
};

// Cache for parent -> children folder listings
const parentFolderCache = {}; // { [parentId]: { data, timestamp } }

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
            pageSize: 200,
        });

        const files = response.data.files || [];

        // Detect a title photo using a priority list:
        // 1) basename === 'title' (exact, no extension)
        // 2) basename startsWith 'title' (e.g. 'title-1')
        // 3) name contains 'title'
        // 4) basename === 'cover' or contains 'cover' as a fallback
        let titlePhoto = null;
        const allowedExts = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic']);
        const normalized = files.map(f => {
            const name = String(f.name || '').trim();
            const parts = name.split('.');
            const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
            const base = name.replace(/\.[^/.]+$/, '').toLowerCase();
            return {
                raw: f,
                name,
                base,
                lc: name.toLowerCase(),
                ext,
                isImageExt: allowedExts.has(ext),
            };
        });

        // Exact base 'title' (prefer recognized image extensions)
        for (const n of normalized) {
            if (n.base === 'title' && n.isImageExt) {
                titlePhoto = n.raw;
                break;
            }
        }

        // Starts with 'title'
        if (!titlePhoto) {
            for (const n of normalized) {
                if (n.base.startsWith('title') && n.isImageExt) {
                    titlePhoto = n.raw;
                    break;
                }
            }
        }

        // Contains 'title'
        if (!titlePhoto) {
            for (const n of normalized) {
                if (n.lc.includes('title') && n.isImageExt) {
                    titlePhoto = n.raw;
                    break;
                }
            }
        }

        // Fallback: look for 'cover' named files
        if (!titlePhoto) {
            for (const n of normalized) {
                if ((n.base === 'cover' || n.lc.includes('cover')) && n.isImageExt) {
                    titlePhoto = n.raw;
                    break;
                }
            }
        }

        // Debug log: show what was selected as titlePhoto (helps confirm jpg/png detection)
        try {
            console.log(`getPhotosFromFolder: folderId=${folderId} files=${files.length} titlePhoto=${titlePhoto ? `${titlePhoto.name} (${titlePhoto.id})` : 'none'}`);
        } catch (e) {
            // ignore logging errors
        }

        return { files, titlePhoto };
    } catch (error) {
        console.error('Error fetching photos from folder:', error);
        throw error;
    }
}

/**
 * Ensure a corresponding local folder exists for a Drive folder.
 * Creates `uploads/gdrive/<safe-name>` if missing.
 */
function ensureLocalFolder(folderName) {
    try {
        const uploadsRoot = path.join(__dirname, '..', 'uploads');
        const localRoot = path.join(uploadsRoot, 'gdrive');
        if (!fs.existsSync(localRoot)) fs.mkdirSync(localRoot, { recursive: true });

        // safe folder name
        const safe = folderName.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'drive-folder';
        const target = path.join(localRoot, safe);
        if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
        return target;
    } catch (err) {
        console.warn('Failed to ensure local folder for drive folder:', err.message);
        return null;
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
        // Support nested path: e.g. 'parent/child/grandchild'
        const pathSegments = String(gameId).split('/').map(s => s.trim()).filter(Boolean);
        if (pathSegments.length === 0) return { photos: [], titlePhoto: null };

        const drive = await initializeDrive();

        // Resolve the first segment to a folder ID
        let currentFolderId = null;
        const first = pathSegments[0].toLowerCase();
        if (gameToFolderMap && gameToFolderMap[first]) {
            currentFolderId = gameToFolderMap[first];
        } else {
            // Try to find by name
            const found = await findFolderByName(first);
            if (found) currentFolderId = found.id;
        }

        if (!currentFolderId) {
            console.warn(`No folder mapping found for game: ${gameId}`);
            return { photos: [], titlePhoto: null };
        }

        // Traverse further segments (children)
        let redirected = false;
        for (let i = 1; i < pathSegments.length; i++) {
            const seg = pathSegments[i].toLowerCase();
            const resp = await drive.files.list({
                q: `'${currentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false and lower(name)='${seg}'`,
                spaces: 'drive',
                fields: 'files(id, name)',
                pageSize: 10,
            });
            const children = resp.data.files || [];
            if (children.length > 0) {
                currentFolderId = children[0].id;
            } else {
                // Not found – stop traversal
                currentFolderId = null;
                break;
            }
        }

        if (!currentFolderId) {
            console.warn(`Nested folder not found for path: ${gameId}`);
            return { photos: [], titlePhoto: null };
        }

        // If the resolved folder has exactly one child folder and the request targeted the parent, auto-descend
        if (pathSegments.length === 1) {
            const childrenResp = await drive.files.list({
                q: `'${currentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                spaces: 'drive',
                fields: 'files(id, name)',
                pageSize: 20,
            });
            const childFolders = childrenResp.data.files || [];
            if (childFolders.length === 1) {
                // auto-redirect to the single child
                redirected = true;
                currentFolderId = childFolders[0].id;
            }
        }

        // Ensure local folder exists for this Drive folder
        try {
            const metaResp = await drive.files.get({ fileId: currentFolderId, fields: 'id, name' });
            if (metaResp && metaResp.data && metaResp.data.name) {
                ensureLocalFolder(metaResp.data.name);
            }
        } catch (e) {
            // ignore
        }

        const { files, titlePhoto } = await getPhotosFromFolder(currentFolderId);
        return { photos: files, titlePhoto, folderId: currentFolderId, redirected };
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

        // Ensure local folders exist for discovered Drive folders
        try {
            for (const f of folders) {
                if (f && f.name) ensureLocalFolder(f.name);
            }
        } catch (e) {
            console.warn('Error ensuring local folders for discovered Drive folders:', e.message);
        }

        console.log(`Found ${folders.length} folders in Google Drive`);
        return folders;
    } catch (error) {
        console.error('Error discovering folders:', error);
        throw error;
    }
}

/**
 * Discover immediate subfolders of a given parent folder (by id or name).
 * If no identifier provided, uses env UMAZON_EVENTS_PARENT_FOLDER_ID or falls back to name 'umazon test'.
 * Returns array of { id, name, createdTime } for children only (not recursive).
 */
async function discoverSubfolders(parentIdentifier) {
    try {
        const drive = await initializeDrive();

        // Resolve parent ID
        let parentId = null;
        const envParent = process.env.UMAZON_EVENTS_PARENT_FOLDER_ID;

        // If explicit parentIdentifier provided, try using it as ID first
        if (parentIdentifier) {
            // try treat as ID
            try {
                const meta = await drive.files.get({ fileId: parentIdentifier, fields: 'id,name' });
                if (meta && meta.data && meta.data.id) parentId = meta.data.id;
            } catch (e) {
                // not an ID, we'll treat as name
            }
        }

        // If still no parentId and env var set, try that
        if (!parentId && envParent) {
            try {
                const meta = await drive.files.get({ fileId: envParent, fields: 'id,name' });
                if (meta && meta.data && meta.data.id) parentId = meta.data.id;
            } catch (e) {
                // ignore
            }
        }

        // If still not found, try by name: provided identifier or 'umazon test'
        if (!parentId) {
            const nameToFind = parentIdentifier || 'umazon test';
            // Try fast cached discovery first
            const folders = await discoverGameFolders();
            const found = folders.find(f => f.name && f.name.toLowerCase() === String(nameToFind).toLowerCase());
            if (found) parentId = found.id;
            else {
                // Query Drive directly for a folder named exactly nameToFind
                const resp = await drive.files.list({
                    q: `mimeType='application/vnd.google-apps.folder' and name='${nameToFind.replace(/'/g, "\\'")}' and trashed=false`,
                    spaces: 'drive',
                    fields: 'files(id,name)',
                    pageSize: 10,
                });
                const candidates = resp.data.files || [];
                if (candidates.length > 0) parentId = candidates[0].id;
            }
        }

        if (!parentId) {
            console.warn('Could not resolve parent folder for', parentIdentifier || envParent || 'umazon test');
            return [];
        }

        // Log resolved parent for debugging (helps confirm we're querying the expected folder)
        try {
            console.log(`discoverSubfolders: resolved parent -> id=${parentId} identifier=${parentIdentifier || envParent || 'umazon test'}`);
        } catch (e) {
            // ignore
        }
        // Check cache for this parent
        const now = Date.now();
        const cacheEntry = parentFolderCache[parentId];
        if (cacheEntry && (now - cacheEntry.timestamp) < folderCache.TTL) {
            return cacheEntry.data;
        }

        // List immediate children folders
        const response = await drive.files.list({
            q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name, createdTime, modifiedTime)',
            pageSize: 500,
        });

        const children = response.data.files || [];

        // Cache it
        parentFolderCache[parentId] = { data: children, timestamp: now };

        // Ensure local folders for these children
        try {
            for (const c of children) {
                if (c && c.name) ensureLocalFolder(c.name);
            }
        } catch (e) {
            console.warn('Error ensuring local folders for parent children:', e.message);
        }

        return children;
    } catch (error) {
        console.error('Error discovering subfolders:', error);
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
    discoverSubfolders,
    clearFolderCache,
    getCacheStatus,
};
