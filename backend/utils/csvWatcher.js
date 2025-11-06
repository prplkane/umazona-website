const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const csv = require('csv-parser');
const db = require('../database.js');

const watchFolder = path.resolve (__dirname, '../uploads');
const archiveFolder = path.resolve (__dirname, '../uploads/archive');
const targetFile = 'events.csv'
const targetFilePath = path.join(watchFolder, targetFile);

if (!fs.existsSync(archiveFolder)) {
    fs.mkdirSync(archiveFolder, { recursive: true })
}

async function processCSV(filePath) {
    console.log(`New file detected: ${filePath}. Processing...:3`);

    const events = []

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            events.push(row);
        })
        .on('end', () => {
            if (events.length === 0) {
                console.log('CSV file is empty. No data to process.');
                return;
            }
        console.log(`Found ${events.length} events in the CSV. Updating database...`);

        db.serialize(() => {
            db.run(`DELETE FROM events`, (err) => {
          if (err) {
            return console.error('Failed to delete old events:', err.message);
          }
          console.log('Successfully deleted all old events.');

          // Step B: PREPARE the insert statement
          const stmt = db.prepare(`
            INSERT INTO events (event_name, event_date, address, details) 
            VALUES (?, ?, ?, ?)
          `);

          // Step C: INSERT all new events
          let insertedCount = 0;
          for (const event of events) {
            stmt.run(
              event.event_name, 
              event.event_date, 
              event.address, 
              event.details,
              (err) => {
                if (err) console.error('Error inserting row:', event, err.message);
                else insertedCount++;
              }
            );
          }

          // Step D: FINALIZE the statement
          stmt.finalize((err) => {
            if (err) console.error('Error finalizing statement:', err.message);
            console.log(`Successfully inserted ${insertedCount} new events.`);
            // Step E: Archive the file
            archiveFile(filePath);
          });
        });
      });
    })
    .on('error', (err) => {
      console.error('Error reading CSV file:', err.message);
    });
}

// 9. Function to move the processed file
function archiveFile(filePath) {
  const archivePath = path.join(archiveFolder, `processed_${Date.now()}_${targetFile}`);
  fs.rename(filePath, archivePath, (err) => {
    if (err) {
      return console.error('Failed to archive file:', err.message);
    }
    console.log(`Successfully archived file to: ${archivePath}`);
  });
}

// 10. The function we will export to start the watcher
function startWatcher() {
    if (fs.existsSync(targetFilePath)) {
    console.log(`[Watcher] Found existing file on startup. Processing: ${targetFilePath}`);
    // If it exists, process it immediately.
    processCSV(targetFilePath);
  } else {
    console.log(`[Watcher] No 'events.csv' found on startup. Waiting for new file.`);
  }

  console.log(`[Watcher] Monitoring for ${targetFile} in: ${watchFolder}`);

  const watcher = chokidar.watch(targetFilePath, {
    persistent: true,
    ignoreInitial: true, // Don't fire on existing files, only new ones
  });

  // 11. Set up the event listener
  watcher.on('add', (path) => {
    console.log(`[Watcher] 'add' event detected for: ${path}`);
    // Add a small delay to ensure the file is fully written
    setTimeout(() => processCSV(path), 1000); 
  });

  watcher.on('change', (path) => {
    console.log(`[Watcher] 'change' event detected for: ${path}`);
    // Also process the file if it's saved over (changed)
    setTimeout(() => processCSV(path), 1000);
  });

  watcher.on('error', (err) => {
    console.error('[Watcher] Error:', err);
  });
}

// 12. Export the start function
module.exports = { startWatcher };