const { Pool } = require('pg');
require('dotenv').config();

const logger = require('../utils/logger');

// Sample data for Uttar Pradesh districts
const upDistricts = [
  { name: 'Agra', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081, iso: 'IN-UP-AGR' },
  { name: 'Aligarh', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 27.8974, lng: 78.0880, iso: 'IN-UP-ALI' },
  { name: 'Allahabad', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463, iso: 'IN-UP-ALL' },
  { name: 'Ambedkar Nagar', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 26.4059, lng: 83.1947, iso: 'IN-UP-AMB' },
  { name: 'Amethi', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 26.1594, lng: 81.8129, iso: 'IN-UP-AME' },
  { name: 'Amroha', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 28.9034, lng: 78.4677, iso: 'IN-UP-AMR' },
  { name: 'Auraiya', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 26.4648, lng: 79.5041, iso: 'IN-UP-AUR' },
  { name: 'Azamgarh', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 26.0685, lng: 83.1836, iso: 'IN-UP-AZA' },
  { name: 'Baghpat', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 28.9477, lng: 77.2056, iso: 'IN-UP-BAG' },
  { name: 'Bahraich', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 27.5742, lng: 81.5947, iso: 'IN-UP-BAH' },
  { name: 'Ballia', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 25.7581, lng: 84.1497, iso: 'IN-UP-BAL' },
  { name: 'Balrampur', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 27.4308, lng: 82.1811, iso: 'IN-UP-BLR' },
  { name: 'Banda', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 25.4761, lng: 80.3364, iso: 'IN-UP-BAN' },
  { name: 'Barabanki', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 26.9247, lng: 81.1947, iso: 'IN-UP-BAR' },
  { name: 'Bareilly', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 28.3670, lng: 79.4304, iso: 'IN-UP-BRE' },
  { name: 'Basti', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 26.7928, lng: 82.7364, iso: 'IN-UP-BAS' },
  { name: 'Bhadohi', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 25.3956, lng: 82.5685, iso: 'IN-UP-BHD' },
  { name: 'Bijnor', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 29.3731, lng: 78.1364, iso: 'IN-UP-BIJ' },
  { name: 'Budaun', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 28.0409, lng: 79.1147, iso: 'IN-UP-BUD' },
  { name: 'Bulandshahr', state_id: 'UP', state_name: 'Uttar Pradesh', lat: 28.4041, lng: 77.8498, iso: 'IN-UP-BUL' }
];

async function seedDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    logger.info('Starting database seeding...');

    // Insert districts
    logger.info('Inserting districts...');
    for (const district of upDistricts) {
      await pool.query(`
        INSERT INTO districts (name, state_id, state_name, centroid_lat, centroid_lng, iso_code)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [district.name, district.state_id, district.state_name, district.lat, district.lng, district.iso]);
    }

    // Generate sample MGNREGA data for the last 24 months
    logger.info('Generating sample MGNREGA data...');
    
    const districts = await pool.query('SELECT id FROM districts');
    const currentDate = new Date();
    
    for (const district of districts.rows) {
      for (let monthsBack = 0; monthsBack < 24; monthsBack++) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - monthsBack);
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        // Generate realistic sample data with some variation
        const baseHouseholds = 15000 + Math.floor(Math.random() * 10000);
        const workProvided = Math.floor(baseHouseholds * (0.6 + Math.random() * 0.3));
        const personDays = Math.floor(workProvided * (80 + Math.random() * 40));
        const avgWage = 200 + Math.floor(Math.random() * 50);
        const totalWages = personDays * avgWage;
        const womenParticipation = 40 + Math.random() * 20;
        const worksCompleted = Math.floor(50 + Math.random() * 100);
        const worksOngoing = Math.floor(20 + Math.random() * 50);
        
        await pool.query(`
          INSERT INTO mgnrega_monthly (
            district_id, year, month, households_registered, households_work_provided,
            total_persondays, wages_paid, women_participation_pct, works_completed,
            works_ongoing, avg_wage, source_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (district_id, year, month) DO NOTHING
        `, [
          district.id, year, month, baseHouseholds, workProvided,
          personDays, totalWages, womenParticipation, worksCompleted,
          worksOngoing, avgWage, date
        ]);
      }
    }

    // Create a sample admin user
    logger.info('Creating sample admin user...');
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', 'admin@mgnrega-lokdekho.gov.in', hashedPassword, 'admin']);

    // Insert some sample fetch logs
    logger.info('Creating sample fetch logs...');
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      await pool.query(`
        INSERT INTO fetch_logs (source_url, status, started_at, finished_at, response_size, records_processed)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'https://api.data.gov.in/resource/mgnrega-data',
        Math.random() > 0.1 ? 'success' : 'error',
        date,
        new Date(date.getTime() + 30000), // 30 seconds later
        Math.floor(50000 + Math.random() * 100000),
        Math.floor(100 + Math.random() * 500)
      ]);
    }

    logger.info('Database seeding completed successfully!');
    
    // Print summary
    const summary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM districts) as districts_count,
        (SELECT COUNT(*) FROM mgnrega_monthly) as monthly_records_count,
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM fetch_logs) as fetch_logs_count
    `);
    
    logger.info('Seeding summary:', summary.rows[0]);
    
  } catch (err) {
    logger.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };