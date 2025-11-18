require('dotenv').config();
const { google } = require('googleapis');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const db = require('./database.js');
const { startWatcher } = require('./utils/csvWatcher.js');

// Google Drive and game mapping utilities
const { getPhotosByGame, discoverGameFolders, discoverSubfolders, getCacheStatus, clearFolderCache } = require('./utils/googleDriveService.js');
const { initializeGameMapping, getGameFolderId, getAvailableGames, getGameMapping } = require('./utils/gameConfig.js');

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });
}

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const uploadsRoot = path.join(__dirname, 'uploads');
const themesUploadDir = path.join(uploadsRoot, 'themes');


if (!fs.existsSync(themesUploadDir)) {
    fs.mkdirSync(themesUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, themesUploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '.png';
        const baseName = path.basename(file.originalname, ext).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${baseName || 'theme'}-${unique}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsRoot));

const verifyAdmin = (req, res, next) => {
    if (!ADMIN_TOKEN) {
        return next();
    }
    const providedToken = req.get('x-admin-token');
    if (providedToken !== ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
};

// APIS
app.get('/auth/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',   // important: gives refresh_token
        scope: DRIVE_SCOPES,
        prompt: 'consent',        // forces consent so we actually get a refresh_token
    });

    res.redirect(url);
});

app.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send('Missing "code" parameter.');
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        // tokens will contain access_token, refresh_token, expiry_date, etc.
        console.log('Google OAuth tokens:', tokens);

        // You can store it anywhere secure. For quick dev, write to a local file:
        fs.writeFileSync(
            path.join(__dirname, 'google-tokens.json'),
            JSON.stringify(tokens, null, 2)
        );

        res.send('Authorization successful. You can close this window now.');
    } catch (err) {
        console.error('Error exchanging code for tokens:', err);
        res.status(500).send('Failed to get tokens. Check server logs.');
    }
});

app.post('/api/admin/upload-theme', verifyAdmin, upload.single('theme'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не получен.' });
    }

    const relativePath = `/uploads/themes/${req.file.filename}`;
    return res.status(201).json({
        message: 'Изображение загружено.',
        url: relativePath,
    });
});

app.post('/api/admin/next-game', verifyAdmin, (req, res) => {

    const {
        event_name,
        event_date,
        start_time,
        address,
        details,
        theme_image_url,
        notes,
        status,
    } = req.body || {};

    if (!event_name || !event_date) {
        return res.status(400).json({ error: 'event_name and event_date are required.' });
    }

    const parsedDate = new Date(event_date);
    if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'event_date must be a valid date string.' });
    }

    const isoDate = parsedDate.toISOString();
    const trimmedStartTime = start_time ? String(start_time).trim() : null;
    const trimmedAddress = address ? String(address).trim() : null;
    const trimmedDetails = details ? String(details).trim() : null;
    const trimmedThemeImageUrl = theme_image_url ? String(theme_image_url).trim() : null;
    const trimmedNotes = notes ? String(notes).trim() : null;
    const normalizedStatus = (() => {
        if (!status) return 'upcoming';
        const lower = String(status).trim().toLowerCase();
        return lower === 'completed' ? 'completed' : 'upcoming';
    })();

    db.serialize(() => {
        db.run(
            `DELETE FROM events WHERE event_name = ? AND event_date = ?`,
            [event_name, isoDate],
            (deleteErr) => {
                if (deleteErr) {
                    console.error('Failed to remove existing event before insert:', deleteErr.message);
                }
            }
        );

        const insertSql = `
            INSERT INTO events (event_name, event_date, start_time, address, details, theme_image_url, notes, status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        db.run(
            insertSql,
            [
                event_name,
                isoDate,
                trimmedStartTime,
                trimmedAddress,
                trimmedDetails,
                trimmedThemeImageUrl,
                trimmedNotes,
                normalizedStatus,
            ],
            function (err) {
                if (err) {
                    console.error('Error inserting next game:', err.message);
                    return res.status(500).json({ error: 'Failed to save next game.' });
                }

                console.log(`Next game saved with id ${this.lastID}`);
                return res.status(201).json({
                    message: 'Next game saved successfully.',
                    data: {
                        id: this.lastID,
                        event_name,
                        event_date: isoDate,
                        start_time: trimmedStartTime,
                        address: trimmedAddress,
                        details: trimmedDetails,
                        theme_image_url: trimmedThemeImageUrl,
                        status: normalizedStatus,
                        notes: trimmedNotes,
                    },
                });
            }
        );
    });
});

app.get('/api/admin/events', verifyAdmin, (_req, res) => {
    const sql = `SELECT * FROM events ORDER BY datetime(event_date) DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Failed to retrieve admin events:', err.message);
            return res.status(500).json({ error: 'Failed to retrieve events.' });
        }

        return res.status(200).json({
            message: 'Events retrieved successfully.',
            data: rows,
        });
    });
});

app.put('/api/admin/events/:id', verifyAdmin, (req, res) => {
    const eventId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({ error: 'Invalid event id.' });
    }

    db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, existing) => {
        if (err) {
            console.error('Failed to load event for update:', err.message);
            return res.status(500).json({ error: 'Failed to load event.' });
        }

        if (!existing) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        const {
            event_name,
            event_date,
            start_time,
            address,
            details,
            theme_image_url,
            notes,
            status,
        } = req.body || {};

        const updatedName = event_name !== undefined ? String(event_name).trim() : existing.event_name;
        const updatedDateISO =
            event_date !== undefined
                ? (() => {
                    const parsed = new Date(event_date);
                    if (Number.isNaN(parsed.getTime())) {
                        return null;
                    }
                    return parsed.toISOString();
                })()
                : existing.event_date;

        if (!updatedName || !updatedDateISO) {
            return res.status(400).json({ error: 'event_name and event_date are required.' });
        }

        const updatedStartTime =
            start_time !== undefined ? (start_time ? String(start_time).trim() : null) : existing.start_time;
        const updatedAddress =
            address !== undefined ? (address ? String(address).trim() : null) : existing.address;
        const updatedDetails =
            details !== undefined ? (details ? String(details).trim() : null) : existing.details;
        const updatedThemeImageUrl =
            theme_image_url !== undefined ? (theme_image_url ? String(theme_image_url).trim() : null) : existing.theme_image_url;
        const updatedNotes =
            notes !== undefined ? (notes ? String(notes).trim() : null) : existing.notes;
        const updatedStatus = (() => {
            const value =
                status !== undefined ? String(status).trim().toLowerCase() : existing.status || 'upcoming';
            return value === 'completed' ? 'completed' : 'upcoming';
        })();

        const updateSql = `
            UPDATE events
            SET event_name = ?, event_date = ?, start_time = ?, address = ?, details = ?, theme_image_url = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        db.run(
            updateSql,
            [
                updatedName,
                updatedDateISO,
                updatedStartTime,
                updatedAddress,
                updatedDetails,
                updatedThemeImageUrl,
                updatedNotes,
                updatedStatus,
                eventId,
            ],
            function (updateErr) {
                if (updateErr) {
                    console.error('Failed to update event:', updateErr.message);
                    return res.status(500).json({ error: 'Failed to update event.' });
                }

                return res.status(200).json({
                    message: 'Event updated successfully.',
                    data: {
                        id: eventId,
                        event_name: updatedName,
                        event_date: updatedDateISO,
                        start_time: updatedStartTime,
                        address: updatedAddress,
                        details: updatedDetails,
                        theme_image_url: updatedThemeImageUrl,
                        status: updatedStatus,
                        notes: updatedNotes,
                    },
                });
            }
        );
    });
});

app.delete('/api/admin/events/:id', verifyAdmin, (req, res) => {
    const eventId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({ error: 'Invalid event id.' });
    }

    db.run('DELETE FROM events WHERE id = ?', [eventId], function (err) {
        if (err) {
            console.error('Failed to delete event:', err.message);
            return res.status(500).json({ error: 'Failed to delete event.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        console.log(`Event ${eventId} deleted`);
        return res.status(200).json({ message: 'Event deleted successfully.' });
    });
});

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

app.get('/api/events', (_req, res) => {
    const sql = `
        SELECT *
        FROM events
        WHERE (status IS NULL OR status != 'completed')
          AND datetime(event_date) >= datetime('now', '-1 day')
        ORDER BY datetime(event_date) ASC
    `;
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
        const { game, folderId } = req.query;

        // If a folderId is supplied, fetch directly from that Drive folder (more robust)
        if (folderId) {
            try {
                const gsvc = require('./utils/googleDriveService.js');
                const { getPhotosFromFolder, initializeDrive } = gsvc;
                const { files, titlePhoto } = await getPhotosFromFolder(folderId);
                // try to fetch folder metadata (name) for better client display
                let folderName = null;
                try {
                    const drive = await initializeDrive();
                    const meta = await drive.files.get({ fileId: folderId, fields: 'id,name' });
                    if (meta && meta.data && meta.data.name) folderName = meta.data.name;
                } catch (e) {
                    // ignore metadata errors
                }
                if ((!files || files.length === 0) && !titlePhoto) {
                    return res.status(404).json({ error: `No photos found for folderId: ${folderId}` });
                }

                return res.status(200).json({
                    message: `Photos retrieved successfully for folderId: ${folderId}`,
                    folderId,
                    folderName,
                    count: files.length,
                    titlePhoto,
                    data: files,
                });
            } catch (err) {
                console.error('Error fetching photos by folderId:', err);
                return res.status(500).json({ error: 'Failed to fetch photos by folderId', details: err.message });
            }
        }

        if (!game) {
            const availableGames = getAvailableGames();
            return res.status(400).json({
                error: 'Missing required query parameter: game',
                example: '/api/photos?game=basketball',
                availableGames: availableGames.length > 0 ? availableGames : 'None configured',
            });
        }

        // Use the global game mapping (initialized at startup)
        const result = await getPhotosByGame(game, gameMapping || {});

        const photos = result.photos || [];
        const titlePhoto = result.titlePhoto || null;

        if ((!photos || photos.length === 0) && !titlePhoto) {
            const availableGames = getAvailableGames();
            return res.status(404).json({
                error: `No photos found for: ${game}`,
                availableGames: availableGames.length > 0 ? availableGames : 'None configured',
            });
        }

        res.status(200).json({
            message: `Photos retrieved successfully for game: ${game}`,
            game,
            count: photos.length,
            titlePhoto,
            redirected: !!result.redirected,
            folderId: result.folderId,
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

// Proxy endpoint: Fetch and stream a photo from Google Drive
app.get('/api/photo/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        if (!fileId) {
            return res.status(400).json({ error: 'Missing fileId parameter' });
        }

        const { initializeDrive } = require('./utils/googleDriveService.js');
        const drive = await initializeDrive();

        // Optional: fetch metadata for correct mimeType
        let mimeType = 'image/jpeg';
        try {
            const meta = await drive.files.get({
                fileId,
                fields: 'mimeType'
            });
            if (meta?.data?.mimeType) {
                mimeType = meta.data.mimeType;
            }
        } catch (err) {
            console.warn(`Metadata fetch failed for ${fileId}:`, err.message);
        }

        // Fetch raw file stream
        const driveResp = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=86400');

        // Pipe data directly from Google → client
        driveResp.data
            .on('error', (err) => {
                console.error('Stream error:', err.message);
                res.status(500).end('Stream error');
            })
            .pipe(res);

    } catch (err) {
        console.error('❌ /api/photo error:', err.message);
        res.status(500).json({ error: 'Failed to fetch photo', details: err.message });
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

// Endpoint: List immediate children of a parent folder
app.get('/api/folders/children', async (req, res) => {
    try {
        const parent = req.query.parent;
        const children = await discoverSubfolders(parent);

        res.status(200).json({
            message: 'Child folders retrieved successfully',
            count: children.length,
            folders: children.map(f => ({ id: f.id, name: f.name, created: f.createdTime, modified: f.modifiedTime })),
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve child folders',
            details: error.message,
        });
    }
});

// Endpoint: List immediate children + a detected cover (title photo or first image)
app.get('/api/folders/children-with-cover', async (req, res) => {
    try {
        const parent = req.query.parent;
        const children = await discoverSubfolders(parent);

        // Require drive helpers locally
        const gsvc = require('./utils/googleDriveService.js');
        const { getPhotosFromFolder } = gsvc;

        const items = await Promise.all(children.map(async (c) => {
            try {
                const { files, titlePhoto } = await getPhotosFromFolder(c.id);
                const coverId = (titlePhoto && titlePhoto.id) || (files && files[0] && files[0].id) || null;
                return {
                    id: c.id,
                    name: c.name,
                    created: c.createdTime,
                    modified: c.modifiedTime,
                    count: files ? files.length : 0,
                    coverId,
                    titlePhoto: titlePhoto || null,
                };
            } catch (e) {
                return {
                    id: c.id,
                    name: c.name,
                    created: c.createdTime,
                    modified: c.modifiedTime,
                    count: 0,
                    coverId: null,
                    titlePhoto: null,
                };
            }
        }));

        res.status(200).json({
            message: 'Child folders with cover retrieved successfully',
            count: items.length,
            folders: items,
        });
    } catch (error) {
        console.error('Failed to retrieve child folders with cover', error);
        res.status(500).json({
            error: 'Failed to retrieve child folders with cover',
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

// Initialize mapping helper used at startup
let gameMapping = null;
async function initializeServer() {
    try {
        gameMapping = await initializeGameMapping();
    } catch (error) {
        console.error('❌ Failed to initialize game mapping:', error.message);
        console.error('Stack:', error.stack);
        throw error;  // Re-throw so we see the actual issue at startup
    }
}

// Initialize game mapping and then start server
initializeServer().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
})

