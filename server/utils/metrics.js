const client = require('prom-client');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'mgnrega-lokdekho'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const dbConnectionsActive = new client.Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections'
});

const redisHitRate = new client.Counter({
  name: 'redis_cache_hits_total',
  help: 'Total number of Redis cache hits',
  labelNames: ['type']
});

const dataSync = new client.Counter({
  name: 'data_sync_total',
  help: 'Total number of data sync operations',
  labelNames: ['status', 'source']
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(dbConnectionsActive);
register.registerMetric(redisHitRate);
register.registerMetric(dataSync);

function initializeMetrics() {
  // Set up periodic collection of DB connection metrics
  setInterval(() => {
    // This would need to be implemented based on your DB pool
    // dbConnectionsActive.set(pool.totalCount);
  }, 10000);
}

function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
}

module.exports = {
  register,
  initializeMetrics,
  metricsMiddleware,
  metrics: {
    httpRequestDuration,
    httpRequestsTotal,
    dbConnectionsActive,
    redisHitRate,
    dataSync
  }
};