const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// --- Database Setup ---
const dbPath = path.resolve(__dirname, 'sqldb.db');
console.log("Using SQLite database file at:", dbPath);

// Check if the database file exists
if (fs.existsSync(dbPath)) {
  console.log("Database file found.");
} else {
  console.warn("Database file not found! A new database will be created at:", dbPath);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    // Create table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS Main_Headline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        headline_title TEXT NOT NULL,
        headline_body TEXT NOT NULL,
        published TEXT NOT NULL,
        publisher TEXT NOT NULL
      )
    `;
    db.run(createTableQuery, (err) => {
      if (err) {
        console.error("Error creating table:", err.message);
      } else {
        console.log("Ensured table Main_Headline exists.");
      }
    });
  }
});

// --- Assets Endpoint ---
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// --- API Endpoints ---

// Get all news headlines
app.get('/api/news', (req, res) => {
  const query = "SELECT id, headline_title, published, publisher FROM Main_Headline ORDER BY published DESC";
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error querying news headlines:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log("News headlines fetched:", rows);
    res.json(rows);
  });
});

// Get a single news article by ID (including the body)
app.get('/api/news/:id', (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM Main_Headline WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error(`Error querying news article with id ${id}:`, err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`News article fetched for id ${id}:`, row);
    res.json(row || {}); // Return an empty object if not found
  });
});

// --- Debug Endpoints ---

// List tables in the database
app.get('/debug/tables', (req, res) => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
      console.error("Error fetching tables:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log("Tables in database:", rows);
    res.json(rows);
  });
});

// Return the count of records in Main_Headline
app.get('/debug/count-main-headline', (req, res) => {
  db.get("SELECT COUNT(*) as count FROM Main_Headline", [], (err, row) => {
    if (err) {
      console.error("Error counting Main_Headline rows:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log("Main_Headline row count:", row.count);
    res.json(row);
  });
});

// --- Serve Static Files ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.use(express.static(path.resolve(__dirname))); // Serve files from the project root

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
