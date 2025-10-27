const express = require('express');
const Joi = require('joi');
const logger = require('../utils/logger');
const { Queue } = require('bullmq');

const router = express.Router();

// Initialize job queue
const dataQueue = new Queue('data-sync', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  }
});

// Validation schemas
const refreshSchema = Joi.object({
  district_id: Joi.number().integer().optional(),
  force: Joi.boolean().default(false)
});

// POST /api/admin/refresh - Queue manual data refresh
router.post('/refresh', async (req, res) => {
  try {
    const { error, value } = refreshSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { district_id, force } = value;

    // Add job to queue
    const job = await dataQueue.add('manual-refresh', {
      district_id,
      force,
      requested_by: 'admin',
      requested_at: new Date().toISOString()
    }, {
      priority: 1, // High priority for manual requests
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      }
    });

    logger.info(`Manual refresh queued: job ${job.id}`, { district_id, force });

    res.json({
      message: 'Refresh job queued successfully',
      job_id: job.id,
      district_id,
      estimated_completion: new Date(Date.now() + 60000).toISOString() // ~1 minute
    });
  } catch (err) {
    logger.error('Error queueing refresh job:', err);
    res.status(500).json({ error: 'Failed to queue refresh job' });
  }
});

// GET /api/admin/jobs - Get job status
router.get('/jobs', async (req, res) => {
  try {
    const { job_id } = req.query;

    if (job_id) {
      const job = await dataQueue.getJob(job_id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({
        id: job.id,
        name: job.name,
        data: job.data,
        progress: job.progress,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        opts: job.opts
      });
    } else {
      // Get recent jobs
      const waiting = await dataQueue.getWaiting(0, 10);
      const active = await dataQueue.getActive(0, 10);
      const completed = await dataQueue.getCompleted(0, 10);
      const failed = await dataQueue.getFailed(0, 10);

      res.json({
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        recent_jobs: {
          waiting: waiting.map(j => ({ id: j.id, name: j.name, data: j.data })),
          active: active.map(j => ({ id: j.id, name: j.name, data: j.data, progress: j.progress })),
          completed: completed.map(j => ({ id: j.id, name: j.name, finishedOn: j.finishedOn })),
          failed: failed.map(j => ({ id: j.id, name: j.name, failedReason: j.failedReason }))
        }
      });
    }
  } catch (err) {
    logger.error('Error fetching job status:', err);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

// GET /api/admin/stats - Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;

    // Database stats
    const dbStats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM districts) as total_districts,
        (SELECT COUNT(*) FROM mgnrega_monthly) as total_monthly_records,
        (SELECT COUNT(*) FROM mgnrega_monthly WHERE source_date >= NOW() - INTERVAL '30 days') as recent_records,
        (SELECT MAX(source_date) FROM mgnrega_monthly) as latest_data_date,
        (SELECT MIN(source_date) FROM mgnrega_monthly) as earliest_data_date
    `);

    // Fetch logs stats
    const fetchStats = await db.query(`
      SELECT 
        COUNT(*) as total_fetches,
        COUNT(*) FILTER (WHERE status = 'success') as successful_fetches,
        COUNT(*) FILTER (WHERE status = 'error') as failed_fetches,
        AVG(response_size) as avg_response_size,
        MAX(finished_at) as last_fetch_time
      FROM fetch_logs 
      WHERE started_at >= NOW() - INTERVAL '7 days'
    `);

    // Redis stats
    const redisInfo = await redis.info('memory');
    const redisMemory = redisInfo.split('\r\n')
      .filter(line => line.includes('used_memory_human'))
      .map(line => line.split(':')[1])[0];

    res.json({
      database: dbStats.rows[0],
      fetch_performance: fetchStats.rows[0],
      redis: {
        memory_used: redisMemory,
        connected: true
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node_version: process.version,
        environment: process.env.NODE_ENV
      },
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Error fetching admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;