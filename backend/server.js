const express = require('express');
const cors = require('cors');

const app = express();
const db = require('./database.js');
const { startWatcher } = require('./utils/csvWatcher.js');
const { getPhotosByGame, discoverGameFolders, getCacheStatus, clearFolderCache } = require('./utils/googleDriveService.js');
const { initializeGameMapping, getGameFolderId, getAvailableGames, getGameMapping } = require('./utils/gameConfig.js');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize game folder mapping on startup
let gameMapping = null;
async function initializeServer() {
    try {
        gameMapping = await initializeGameMapping();
    } catch (error) {
        console.error('Failed to initialize game mapping:', error);
        console.warn('Server continuing, but /api/photos may not work correctly');
    }
}


//APIS
app.get('/', (req, res) => {
    res.send('Hello from the backend!');
})

app.post('/api/contacts', (req, res) => {
    const { name, phone, email, message } = req.body
    if (!name || !email) {
        return res.status(400).json({ error: "Name and Email are required fields." })
    }
    const sql = `INSERT INTO contacts (name, phone, email, message) 
                 VALUES (?, ?, ?, ?)`;
    const params = [name, phone, email, message];

    db.run(sql, params, function (err) {
        if (err) {
            console.error(err.message)
            return res.status(500).json({ error: "An error occurred while saving the contact." })
        }
        res.status(201).json({
            message: "Contact saved successfully.", data: { id: this.lastID, name: name, email: email }
        })
    })
})

app.get('/api/events', (req, res) => {
    const sql = `SELECT * FROM events ORDER BY event_date ASC`
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message)
            return res.status(500).json({ error: "An error occurred while retrieving events." })
        }
        res.status(200).json({
            message: 'Events retrieved successfully.',
            data: rows
        })
    })
})

app.get('/api/photos', async (req, res) => {
    try {
        const { game } = req.query;

        if (!game) {
            const availableGames = getAvailableGames();
            return res.status(400).json({
                error: 'Missing required query parameter: game',
                example: '/api/photos?game=basketball',
                availableGames: availableGames.length > 0 ? availableGames : 'None configured',
            });
        }

        const folderId = getGameFolderId(game);
        if (!folderId) {
            const availableGames = getAvailableGames();
            return res.status(404).json({
                error: `No photos folder found for game: ${game}`,
                availableGames: availableGames.length > 0 ? availableGames : 'None configured',
                tip: 'Make sure a folder with this exact name exists in Google Drive',
            });
        }

        const photos = await getPhotosByGame(game, { [game]: folderId });

        res.status(200).json({
            message: `Photos retrieved successfully for game: ${game}`,
            game,
            count: photos.length,
            data: photos,
        });
    } catch (error) {
        console.error('Error in /api/photos:', error);
        res.status(500).json({
            error: 'An error occurred while retrieving photos.',
            details: error.message,
        });
    }
});

// Debug endpoint: List all discovered folders
app.get('/api/debug/folders', async (req, res) => {
    try {
        const folders = await discoverGameFolders();
        const cacheStatus = getCacheStatus();

        res.status(200).json({
            message: 'Available folders in Google Drive',
            count: folders.length,
            cacheStatus,
            folders: folders.map(f => ({
                name: f.name,
                id: f.id,
                created: f.createdTime,
            })),
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to discover folders',
            details: error.message,
        });
    }
});

// Debug endpoint: Show current game mapping
app.get('/api/debug/games', (req, res) => {
    const mapping = getGameMapping();
    const availableGames = getAvailableGames();

    res.status(200).json({
        message: 'Current game to folder mapping',
        availableGames,
        gameCount: availableGames.length,
        mapping,
    });
});

// Debug endpoint: Clear folder cache
app.post('/api/debug/cache-clear', (req, res) => {
    try {
        clearFolderCache();
        res.status(200).json({
            message: 'Folder cache cleared. Will refresh on next request.',
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to clear cache',
            details: error.message,
        });
    }
});

startWatcher()

// Initialize game mapping and then start server
initializeServer().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
})

