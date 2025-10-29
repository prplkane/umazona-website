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
            event_date DATETIME NOT NULL,
            address TEXT,
            details TEXT
        )`, (err) => {
            if (err) {
                console.error("CRITICAL: Error creating 'events' table:", err.message);
                throw err;
            } else {
                console.log("Table 'events' is successfully configured.");
            }
      });
      }
    });
  }
});

module.exports = db;