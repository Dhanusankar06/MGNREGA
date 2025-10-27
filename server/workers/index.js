const { Worker, Queue } = require('bullmq');
const { Pool } = require('pg');
const Redis = require('redis');
const cron = require('node-cron');
require('dotenv').config();

const logger = require('../utils/logger');
const { fetchMGNREGAData } = require('./dataFetcher');
const { metrics } = require('../utils/metrics');

// Database and Redis connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const redis = Redis.createClient({
  url: process.env.REDIS_QUEUE_URL || process.env.REDIS_URL
});

redis.on('error', (err) => logger.error('Redis Worker Error', err));
redis.connect();

// Job queue
const dataQueue = new Queue('data-sync', {
  connection: redis
});

// Worker to process data sync jobs
const worker = new Worker('data-sync', async (job) => {
  const { name, data } = job;
  
  logger.info(`Processing job: ${name}`, data);
  
  try {
    switch (name) {
      case 'nightly-full-sync':
        return await processFullSync(job);
      
      case 'incremental-sync':
        return await processIncrementalSync(job);
      
      case 'manual-refresh':
        return await processManualRefresh(job);
      
      default:
        throw new Error(`Unknown job type: ${name}`);
    }
  } catch (error) {
    logger.error(`Job ${name} failed:`, error);
    metrics.dataSync.labels('error', 'worker').inc();
    throw error;
  }
}, {
  connection: redis,
  concurrency: 2, // Process up to 2 jobs concurrently
  removeOnComplete: 50, // Keep last 50 completed jobs
  removeOnFail: 100 // Keep last 100 failed jobs
});

// Full sync process - runs nightly
async function processFullSync(job) {
  const startTime = Date.now();
  let totalRecords = 0;
  let errors = 0;

  try {
    await job.updateProgress(0);
    
    // Get all districts
    const districtsResult = await pool.query('SELECT id, name, state_id FROM districts');
    const districts = districtsResult.rows;
    
    logger.info(`Starting full sync for ${districts.length} districts`);
    
    for (let i = 0; i < districts.length; i++) {
      const district = districts[i];
      
      try {
        await job.updateProgress(Math.floor((i / districts.length) * 100));
        
        // Fetch data for this district
        const records = await fetchMGNREGAData(district.id, {
          fullSync: true,
          months: 24 // Last 24 months
        });
        
        totalRecords += records.length;
        
        // Log successful fetch
        await pool.query(`
          INSERT INTO fetch_logs (source_url, status, started_at, finished_at, response_size, district_id, records_processed)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          `data.gov.in/mgnrega/district/${district.id}`,
          'success',
          new Date(startTime),
          new Date(),
          records.length * 1000, // Approximate size
          district.id,
          records.length
        ]);
        
        metrics.dataSync.labels('success', 'full-sync').inc();
        
      } catch (error) {
        errors++;
        logger.error(`Failed to sync district ${district.name}:`, error);
        
        // Log failed fetch
        await pool.query(`
          INSERT INTO fetch_logs (source_url, status, started_at, finished_at, error_msg, district_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          `data.gov.in/mgnrega/district/${district.id}`,
          'error',
          new Date(startTime),
          new Date(),
          error.message,
          district.id
        ]);
        
        metrics.dataSync.labels('error', 'full-sync').inc();
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    await job.updateProgress(100);
    
    const duration = Date.now() - startTime;
    const result = {
      status: 'completed',
      duration_ms: duration,
      districts_processed: districts.length,
      total_records: totalRecords,
      errors: errors,
      completed_at: new Date().toISOString()
    };
    
    logger.info('Full sync completed:', result);
    return result;
    
  } catch (error) {
    logger.error('Full sync failed:', error);
    throw error;
  }
}

// Incremental sync - checks for updates
async function processIncrementalSync(job) {
  const startTime = Date.now();
  
  try {
    await job.updateProgress(0);
    
    // Get the last successful sync time
    const lastSyncResult = await pool.query(`
      SELECT MAX(finished_at) as last_sync 
      FROM fetch_logs 
      WHERE status = 'success'
    `);
    
    const lastSync = lastSyncResult.rows[0]?.last_sync || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago
    
    logger.info(`Starting incremental sync from ${lastSync}`);
    
    // For incremental sync, we'll check a few key districts for new data
    const keyDistricts = await pool.query(`
      SELECT id, name FROM districts 
      ORDER BY RANDOM() 
      LIMIT 10
    `);
    
    let updatedRecords = 0;
    
    for (let i = 0; i < keyDistricts.rows.length; i++) {
      const district = keyDistricts.rows[i];
      
      try {
        await job.updateProgress(Math.floor((i / keyDistricts.rows.length) * 100));
        
        // Check for updates since last sync
        const records = await fetchMGNREGAData(district.id, {
          since: lastSync,
          months: 3 // Only check last 3 months for incremental
        });
        
        updatedRecords += records.length;
        
      } catch (error) {
        logger.error(`Incremental sync failed for district ${district.name}:`, error);
      }
    }
    
    await job.updateProgress(100);
    
    const result = {
      status: 'completed',
      duration_ms: Date.now() - startTime,
      districts_checked: keyDistricts.rows.length,
      updated_records: updatedRecords,
      completed_at: new Date().toISOString()
    };
    
    logger.info('Incremental sync completed:', result);
    return result;
    
  } catch (error) {
    logger.error('Incremental sync failed:', error);
    throw error;
  }
}

// Manual refresh for specific district
async function processManualRefresh(job) {
  const { district_id, force } = job.data;
  const startTime = Date.now();
  
  try {
    await job.updateProgress(0);
    
    if (district_id) {
      // Refresh specific district
      const district = await pool.query('SELECT id, name FROM districts WHERE id = $1', [district_id]);
      
      if (district.rows.length === 0) {
        throw new Error(`District ${district_id} not found`);
      }
      
      await job.updateProgress(25);
      
      const records = await fetchMGNREGAData(district_id, {
        force: force,
        months: 12
      });
      
      await job.updateProgress(75);
      
      // Clear cache for this district
      const cacheKeys = await redis.keys(`*district*${district_id}*`);
      if (cacheKeys.length > 0) {
        await redis.del(cacheKeys);
      }
      
      await job.updateProgress(100);
      
      return {
        status: 'completed',
        district_id: district_id,
        district_name: district.rows[0].name,
        records_updated: records.length,
        duration_ms: Date.now() - startTime,
        completed_at: new Date().toISOString()
      };
      
    } else {
      // Refresh all districts (force full sync)
      return await processFullSync(job);
    }
    
  } catch (error) {
    logger.error('Manual refresh failed:', error);
    throw error;
  }
}

// Schedule nightly full sync at 2 AM
cron.schedule('0 2 * * *', async () => {
  logger.info('Scheduling nightly full sync');
  
  await dataQueue.add('nightly-full-sync', {
    scheduled_at: new Date().toISOString(),
    type: 'scheduled'
  }, {
    priority: 5,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 60000, // 1 minute
    }
  });
});

// Schedule incremental sync every 4 hours
cron.schedule('0 */4 * * *', async () => {
  logger.info('Scheduling incremental sync');
  
  await dataQueue.add('incremental-sync', {
    scheduled_at: new Date().toISOString(),
    type: 'scheduled'
  }, {
    priority: 3,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 30000, // 30 seconds
    }
  });
});

// Worker event handlers
worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed:`, job.returnvalue);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err);
});

worker.on('error', (err) => {
  logger.error('Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Worker shutting down gracefully...');
  await worker.close();
  await redis.quit();
  await pool.end();
  process.exit(0);
});

logger.info('MGNREGA data sync worker started');

module.exports = { worker, dataQueue };