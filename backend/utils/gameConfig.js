const { discoverGameFolders } = require('./googleDriveService');

let discoveredGameMap = null;
let discoveryAttempted = false;

/**
 * Initialize game folder mapping - discovers all folders from Google Drive
 * Call this once on server startup
 * @returns {Promise<Object>} The folder name to folder ID mapping
 */
async function initializeGameMapping() {
    try {
        if (discoveredGameMap) {
            return discoveredGameMap;
        }

        console.log('\n🔍 Discovering photo folders from Google Drive...');

        const folders = await discoverGameFolders();
        discoveredGameMap = {};

        // Create mapping: folder name -> folder ID
        for (const folder of folders) {
            discoveredGameMap[folder.name.toLowerCase()] = folder.id;
        }

        discoveryAttempted = true;

        if (Object.keys(discoveredGameMap).length > 0) {
            console.log(`✅ Discovered ${Object.keys(discoveredGameMap).length} photo folders:`);
            Object.keys(discoveredGameMap).forEach(name => {
                console.log(`   • ${name}`);
            });
        } else {
            console.warn('⚠️ No folders found in Google Drive');
        }

        return discoveredGameMap;
    } catch (error) {
        console.error('❌ Error initializing game mapping:', error);
        throw error;
    }
}

/**
 * Get the folder ID for a specific game
 * @param {string} gameId - The game identifier
 * @returns {string|null} The Google Drive folder ID, or null if not found
 */
function getGameFolderId(gameId) {
    if (!discoveredGameMap) {
        console.warn('⚠️ Game mapping not initialized. Call initializeGameMapping() first.');
        return null;
    }

    const normalizedGameId = gameId.toLowerCase().trim();
    return discoveredGameMap[normalizedGameId] || null;
}

/**
 * Get all discovered game folders
 * @returns {Object} The complete game to folder mapping
 */
function getGameMapping() {
    return discoveredGameMap || {};
}

/**
 * Get list of all available games
 * @returns {Array<string>} Array of game names that have folders
 */
function getAvailableGames() {
    if (!discoveredGameMap) {
        return [];
    }
    return Object.keys(discoveredGameMap).filter(game => discoveredGameMap[game]);
}

/**
 * Validate that required games are configured
 * @param {Array<string>} requiredGames - List of game names that must be configured
 * @returns {Object} Validation result
 */
function validateGameConfiguration(requiredGames = []) {
    if (!discoveredGameMap) {
        return {
            isValid: false,
            message: 'Game mapping not initialized',
            configured: [],
            missing: requiredGames,
        };
    }

    const configured = requiredGames.filter(game => discoveredGameMap[game.toLowerCase()]);
    const missing = requiredGames.filter(game => !discoveredGameMap[game.toLowerCase()]);

    return {
        isValid: missing.length === 0,
        message: missing.length === 0 ? 'All required games configured' : `Missing folders for: ${missing.join(', ')}`,
        configured,
        missing,
    };
}

/**
 * Add a manual override for a specific game
 * Useful if a game folder has a different name than expected
 * @param {string} gameName - The game name
 * @param {string} folderId - The Google Drive folder ID
 */
function setGameFolderOverride(gameName, folderId) {
    if (!discoveredGameMap) {
        discoveredGameMap = {};
    }
    discoveredGameMap[gameName.toLowerCase()] = folderId;
    console.log(`✓ Set override for ${gameName}: ${folderId}`);
}

module.exports = {
    initializeGameMapping,
    getGameFolderId,
    getGameMapping,
    getAvailableGames,
};
