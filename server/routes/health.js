const express = require('express');

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const redis = req.app.locals.redis;

    // Check database connection
    const dbStart = Date.now();
    await db.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    // Check Redis connection (mock Redis doesn't have ping)
    const redisStart = Date.now();
    await redis.get('health_check');
    const redisLatency = Date.now() - redisStart;

    // Get basic stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_districts,
        (SELECT COUNT(*) FROM mgnrega_monthly) as total_monthly_records,
        (SELECT MAX(source_date) FROM mgnrega_monthly) as latest_data_date
      FROM districts
    `;
    const stats = await db.query(statsQuery);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: {
          status: 'connected',
          latency_ms: dbLatency
        },
        redis: {
          status: 'connected',
          latency_ms: redisLatency
        }
      },
      stats: stats.rows[0],
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV
    });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

// Readiness check (for Kubernetes/Docker)
router.get('/ready', async (req, res) => {
  try {
    const db = req.app.locals.db;
    await db.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message });
  }
});

// Liveness check (for Kubernetes/Docker)
router.get('/live', (req, res) => {
  res.json({ status: 'alive' });
});

module.exports = router;