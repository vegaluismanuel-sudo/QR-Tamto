const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'quality_reports.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Reports Table (General Info)
        db.run(`CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_name TEXT,
      part_number TEXT,
      version TEXT,
      customer TEXT,
      machine TEXT,
      provider TEXT,
      date TEXT,
      traceability TEXT,
      inspector TEXT,
      lot_quantity INTEGER,
      sample_quantity INTEGER,
      report_type TEXT,
      units TEXT,
      part_image_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

        // Measurements/Cotas Table
        // Stores the definition of each row (spec) AND the results (JSON or separate table?)
        // For simplicity and "Excel-like" structure, we can store measurements linked to a report.
        // Results can be a JSON string or we can have a separate results table. 
        // Given 125 samples max, a separate table for results might be huge (rows * samples * reports).
        // Storing results as a JSON string in the measurement row is efficient for this scale.

        db.run(`CREATE TABLE IF NOT EXISTS measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER,
      cota_number TEXT,
      data_type TEXT, -- Variable, Atribute, Reference
      characteristic TEXT,
      is_critical INTEGER, -- 0 or 1
      min_value REAL,
      nominal_value REAL,
      max_value REAL,
      criteria_ok TEXT,
      criteria_nok TEXT,
      tool TEXT,
      tool_id TEXT,
      observations TEXT,
      results JSON, -- Array of values [val1, val2, ...]
      FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE
    )`);
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);

        // Seed users if table is empty
        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (row && row.count === 0) {
                const users = [
                    ['Usuario 1', '8566'],
                    ['Usuario 2', '3197'],
                    ['Usuario 3', '9008'],
                    ['Usuario 4', '4381'],
                    ['Usuario 5', '7756'],
                    ['Usuario 6', '8859'],
                    ['Usuario 7', '4038'],
                    ['Usuario 8', '5781'],
                    ['Usuario 9', '1889'],
                    ['Usuario 10', '2736']
                ];
                const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
                users.forEach(u => stmt.run(u));
                stmt.finalize();
                console.log('Database seeded with initial users.');
            }
        });
    });
}

module.exports = db;
