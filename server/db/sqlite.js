const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create SQLite database for local development
const dbPath = path.join(__dirname, 'mgnrega_dev.db');
const db = new sqlite3.Database(dbPath);

// Initialize tables
const initTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Districts table
      db.run(`CREATE TABLE IF NOT EXISTS districts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        state_id TEXT NOT NULL,
        state_name TEXT NOT NULL,
        centroid_lat REAL,
        centroid_lng REAL,
        iso_code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // MGNREGA monthly data
      db.run(`CREATE TABLE IF NOT EXISTS mgnrega_monthly (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        district_id INTEGER NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        households_registered INTEGER DEFAULT 0,
        households_work_provided INTEGER DEFAULT 0,
        total_persondays INTEGER DEFAULT 0,
        wages_paid REAL DEFAULT 0,
        women_participation_pct REAL DEFAULT 0,
        works_completed INTEGER DEFAULT 0,
        works_ongoing INTEGER DEFAULT 0,
        avg_wage REAL DEFAULT 0,
        source_date DATETIME NOT NULL,
        raw_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(district_id, year, month)
      )`);

      // Fetch logs
      db.run(`CREATE TABLE IF NOT EXISTS fetch_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_url TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at DATETIME NOT NULL,
        finished_at DATETIME,
        response_size INTEGER,
        error_msg TEXT,
        district_id INTEGER,
        records_processed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

// Seed sample data
const seedData = () => {
  return new Promise((resolve, reject) => {
    // Sample districts from different states
    const districts = [
      // Uttar Pradesh
      { name: 'Agra', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081, iso: 'IN-UP-AGR' },
      { name: 'Aligarh', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 27.8974, lng: 78.0880, iso: 'IN-UP-ALI' },
      { name: 'Allahabad', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463, iso: 'IN-UP-ALL' },
      { name: 'Lucknow', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, iso: 'IN-UP-LKO' },
      { name: 'Kanpur', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319, iso: 'IN-UP-KNP' },

      // Delhi
      { name: 'New Delhi', state_id: 'DL', state_name: 'Delhi', lat: 28.6139, lng: 77.2090, iso: 'IN-DL-ND' },
      { name: 'Central Delhi', state_id: 'DL', state_name: 'Delhi', lat: 28.6448, lng: 77.2167, iso: 'IN-DL-CD' },

      // Maharashtra
      { name: 'Mumbai', state_id: 'MH', state_name: 'Maharashtra', lat: 19.0760, lng: 72.8777, iso: 'IN-MH-MU' },
      { name: 'Pune', state_id: 'MH', state_name: 'Maharashtra', lat: 18.5204, lng: 73.8567, iso: 'IN-MH-PU' },

      // Karnataka
      { name: 'Bangalore', state_id: 'KA', state_name: 'Karnataka', lat: 12.9716, lng: 77.5946, iso: 'IN-KA-BL' },
      { name: 'Mysore', state_id: 'KA', state_name: 'Karnataka', lat: 12.2958, lng: 76.6394, iso: 'IN-KA-MY' },

      // West Bengal
      { name: 'Kolkata', state_id: 'WB', state_name: 'West Bengal', lat: 22.5726, lng: 88.3639, iso: 'IN-WB-KO' },
      { name: 'Howrah', state_id: 'WB', state_name: 'West Bengal', lat: 22.5892, lng: 88.3103, iso: 'IN-WB-HR' },

      // Tamil Nadu
      { name: 'Chennai', state_id: 'TN', state_name: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, iso: 'IN-TN-CH' },
      { name: 'Coimbatore', state_id: 'TN', state_name: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, iso: 'IN-TN-CO' }
    ];

    db.serialize(() => {
      const stmt = db.prepare(`INSERT OR IGNORE INTO districts (name, state_id, state_name, centroid_lat, centroid_lng, iso_code) VALUES (?, ?, ?, ?, ?, ?)`);

      districts.forEach(district => {
        stmt.run(district.name, district.state_id, district.state_name, district.lat, district.lng, district.iso);
      });

      stmt.finalize();

      // Generate sample MGNREGA data
      db.all("SELECT id FROM districts", (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const monthlyStmt = db.prepare(`INSERT OR IGNORE INTO mgnrega_monthly 
          (district_id, year, month, households_registered, households_work_provided, total_persondays, wages_paid, women_participation_pct, works_completed, works_ongoing, avg_wage, source_date) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

        rows.forEach(row => {
          for (let monthsBack = 0; monthsBack < 12; monthsBack++) {
            const date = new Date();
            date.setMonth(date.getMonth() - monthsBack);

            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            // Generate realistic sample data
            const baseHouseholds = 15000 + Math.floor(Math.random() * 10000);
            const workProvided = Math.floor(baseHouseholds * (0.6 + Math.random() * 0.3));
            const personDays = Math.floor(workProvided * (80 + Math.random() * 40));
            const avgWage = 200 + Math.floor(Math.random() * 50);
            const totalWages = personDays * avgWage;
            const womenParticipation = 40 + Math.random() * 20;
            const worksCompleted = Math.floor(50 + Math.random() * 100);
            const worksOngoing = Math.floor(20 + Math.random() * 50);

            monthlyStmt.run(
              row.id, year, month, baseHouseholds, workProvided,
              personDays, totalWages, womenParticipation, worksCompleted,
              worksOngoing, avgWage, date.toISOString()
            );
          }
        });

        monthlyStmt.finalize();
        resolve();
      });
    });
  });
};

module.exports = {
  db,
  initTables,
  seedData
};