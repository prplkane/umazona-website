const sqlite3 = require ('sqlite3').verbose()

const DB_source = 'umazona.db'

const db = new sqlite3.Database(DB_source, (err) => {
    if (err) {
        console.error (err.message)
        throw err   
    } 
    else {
    console.log('Connected to the SQLite database.');
    db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT UNIQUE NOT NULL,
        message TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error("CRITICAL: Error creating 'contacts' table:", err.message);
        throw err;
      } else {
        console.log("Table 'contacts' is successfully configured.");
        db.run(`CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT NOT NULL,
            event_date TEXT NOT NULL,
            start_time TEXT,
            address TEXT,
            details TEXT,
            theme_image_url TEXT,
            notes TEXT,
            status TEXT DEFAULT 'upcoming',
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error("CRITICAL: Error creating 'events' table:", err.message);
                throw err;
            } else {
                console.log("Table 'events' is successfully configured.");
                const columnsToEnsure = [
                  { name: 'start_time', sql: "ALTER TABLE events ADD COLUMN start_time TEXT" },
                  { name: 'theme_image_url', sql: "ALTER TABLE events ADD COLUMN theme_image_url TEXT" },
                  { name: 'notes', sql: "ALTER TABLE events ADD COLUMN notes TEXT" },
                  { name: 'status', sql: "ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'upcoming'" },
                  { name: 'updated_at', sql: "ALTER TABLE events ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP" }
                ];

                columnsToEnsure.forEach(({ sql }) => {
                  db.run(sql, (alterErr) => {
                    if (alterErr && !alterErr.message.includes('duplicate column name')) {
                      console.warn(`Warning while ensuring events column: ${alterErr.message}`);
                    }
                  });
                });
            }
      });
      }
    });
  }
});

module.exports = db;