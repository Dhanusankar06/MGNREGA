const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ No DATABASE_URL found, skipping migrations (using SQLite)');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('📄 Creating database tables...');
    
    // Create districts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS districts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        state_id VARCHAR(10) NOT NULL,
        state_name VARCHAR(100) NOT NULL,
        centroid_lat DECIMAL(10, 8),
        centroid_lng DECIMAL(11, 8),
        iso_code VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created districts table');

    // Create mgnrega_monthly table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mgnrega_monthly (
        id SERIAL PRIMARY KEY,
        district_id INTEGER NOT NULL REFERENCES districts(id),
        year INTEGER NOT NULL,
        month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
        households_registered INTEGER DEFAULT 0,
        households_work_provided INTEGER DEFAULT 0,
        total_persondays INTEGER DEFAULT 0,
        wages_paid DECIMAL(15, 2) DEFAULT 0,
        women_participation_pct DECIMAL(5, 2) DEFAULT 0,
        works_completed INTEGER DEFAULT 0,
        works_ongoing INTEGER DEFAULT 0,
        avg_wage DECIMAL(10, 2) DEFAULT 0,
        source_date TIMESTAMP NOT NULL,
        raw_json JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(district_id, year, month)
      )
    `);
    console.log('✅ Created mgnrega_monthly table');

    // Create fetch_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fetch_logs (
        id SERIAL PRIMARY KEY,
        source_url TEXT NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
        started_at TIMESTAMP NOT NULL,
        finished_at TIMESTAMP,
        response_size INTEGER,
        error_msg TEXT,
        district_id INTEGER REFERENCES districts(id),
        records_processed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created fetch_logs table');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created users table');

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_districts_state ON districts(state_id)`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_districts_name_state ON districts(name, state_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_mgnrega_district_date ON mgnrega_monthly(district_id, year, month)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_mgnrega_source_date ON mgnrega_monthly(source_date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_fetch_logs_status ON fetch_logs(status, started_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_fetch_logs_district ON fetch_logs(district_id)`);
    console.log('✅ Created indexes');

    // Create update trigger function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    console.log('✅ Created trigger function');

    // Create triggers
    await pool.query(`
      DROP TRIGGER IF EXISTS update_districts_updated_at ON districts;
      CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON districts
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    
    await pool.query(`
      DROP TRIGGER IF EXISTS update_mgnrega_monthly_updated_at ON mgnrega_monthly;
      CREATE TRIGGER update_mgnrega_monthly_updated_at BEFORE UPDATE ON mgnrega_monthly
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    
    await pool.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✅ Created triggers');
    
    console.log('✅ Database migrations completed successfully!');
    
    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Created tables:', result.rows.map(r => r.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations().catch(console.error);
}

module.exports = { runMigrations };