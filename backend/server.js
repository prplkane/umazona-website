require('dotenv').config();
const { google } = require('googleapis');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const db = require('./database.js');
const { startWatcher } = require('./utils/csvWatcher.js');

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;
const HIRE_SUBJECT = 'Новый запрос на корпоративную игру';
const CONTACT_RECIPIENTS = (
  process.env.CONTACT_RECIPIENTS ||
  'letterforkate@gmail.com,daria.belkina@gmail.com,eugeniashpunt55@gmail.com'
)
  .split(',')
  .map((email) => email.trim())
  .filter(Boolean);

const createContactTransporter = () => {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP_HOST is not configured. Contact form submissions will not be emailed.');
    return null;
  }

  try {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== 'false',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });
  } catch (error) {
    console.error('Failed to configure SMTP transporter for contact form:', error.message);
    return null;
  }
};

let contactTransporter = createContactTransporter();

const sendContactEmail = async ({ name, email, phone, message }) => {
  if (!contactTransporter || CONTACT_RECIPIENTS.length === 0) {
    return;
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@umazona.ru';
  const text = [
    `Имя: ${name}`,
    `Email: ${email}`,
    `Телефон: ${phone || 'не указан'}`,
    '',
    'Комментарий:',
    message || '(без сообщения)',
  ].join('\n');

  try {
    await contactTransporter.sendMail({
      from: fromAddress,
      to: CONTACT_RECIPIENTS,
      subject: `Новая бронь стола от ${name}`,
      text,
    });
  } catch (error) {
    console.error('Failed to send contact form email:', error.message);
  }
};

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

const cleanupOldEvents = () => {
  const sql = `
    DELETE FROM events
    WHERE (status IS NOT NULL AND LOWER(status) = 'completed')
       OR (
         event_date IS NOT NULL
         AND datetime(event_date) < datetime('now', '-1 day')
       )
  `;

  db.run(sql, [], function (err) {
    if (err) {
      console.error('Failed to cleanup past events:', err.message);
      return;
    }

    if (this.changes > 0) {
      console.log(`Cleaned up ${this.changes} past/completed events.`);
    }
  });
};

cleanupOldEvents();
setInterval(cleanupOldEvents, CLEANUP_INTERVAL_MS);

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

//APIS
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

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
    const { name, phone, email, message } = req.body || {};
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and Email are required fields.' });
    }

    const sql = `INSERT INTO contacts (name, phone, email, message) 
                 VALUES (?, ?, ?, ?)`;
    const params = [name, phone, email, message];
    
    db.run(sql, params, function (err) {
        if (err) {
            console.error('Failed to save contact:', err.message);
            return res.status(500).json({ error: 'An error occurred while saving the contact.' });
        }

        const payload = { id: this.lastID, name, email };
        res.status(201).json({ message: 'Contact saved successfully.', data: payload });

        Promise.resolve(sendContactEmail({ name, email, phone, message })).catch(() => {});
    });
});
    
app.get('/api/events', (_req, res) => {
    cleanupOldEvents();
    const sql = `
        SELECT *
        FROM events
        WHERE (status IS NULL OR LOWER(status) != 'completed')
        ORDER BY datetime(event_date) ASC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message)
            return res.status(500).json({error: "An error occurred while retrieving events."})
        }
        res.status(200).json({
            message: 'Events retrieved successfully.',
            data: rows
        })
    })
})

startWatcher()

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);   
})

