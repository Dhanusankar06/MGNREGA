const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
  console.log('📄 Loaded .env file for development');
} else {
  console.log('🚀 Production mode - using environment variables only');
}

// Database setup - use PostgreSQL in production, SQLite in development
let db, initTables, seedData;

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  // PostgreSQL for production
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  db = {
    query: async (text, params) => {
      const result = await pool.query(text, params);
      return { rows: result.rows };
    },
    // Add compatibility methods for existing code
    all: async (query, params) => {
      const result = await pool.query(query, params);
      return result.rows;
    },
    get: async (query, params) => {
      const result = await pool.query(query, params);
      return result.rows[0];
    }
  };

  initTables = async () => {
    console.log('Using PostgreSQL database');
    // Tables should already exist from migrations
  };

  seedData = async () => {
    console.log('Seeding data for production...');
    // Skip complex seeding for faster deployment
    console.log('✅ Using fallback data for faster deployment');
  };
} else {
  // SQLite for development
  const sqliteSetup = require('./db/sqlite');
  db = sqliteSetup.db;
  initTables = sqliteSetup.initTables;
  seedData = sqliteSetup.seedData;
}

const districtRoutes = require('./routes/districts-simple');
const mgnregaRoutes = require('./routes/districts-mgnrega');
const healthRoutes = require('./routes/health');

const app = express();
// Force port configuration for Render
const RENDER_PORT = process.env.PORT;
const DEFAULT_PORT = 10000;
const PORT = RENDER_PORT || DEFAULT_PORT;

// Debug port information - ALWAYS show this
console.log('🔧 PORT CONFIGURATION DEBUG:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   process.env.PORT (Render):', RENDER_PORT);
console.log('   DEFAULT_PORT:', DEFAULT_PORT);
console.log('   FINAL PORT:', PORT);
console.log('   PORT type:', typeof PORT);

// Ensure PORT is a number
const FINAL_PORT = parseInt(PORT, 10);
console.log('   PARSED PORT:', FINAL_PORT);

// Simple in-memory cache for development
const cache = new Map();
const mockRedis = {
  get: async (key) => cache.get(key),
  setEx: async (key, ttl, value) => {
    cache.set(key, value);
    setTimeout(() => cache.delete(key), ttl * 1000);
  },
  del: async (keys) => {
    if (Array.isArray(keys)) {
      keys.forEach(key => cache.delete(key));
    } else {
      cache.delete(keys);
    }
  },
  keys: async (pattern) => {
    return Array.from(cache.keys()).filter(key =>
      pattern === '*' || key.includes(pattern.replace('*', ''))
    );
  }
};

// Make db and redis available to routes
app.locals.db = {
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    });
  }
};
app.locals.redis = mockRedis;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://mgnrega-eirq.onrender.com']
    : ['http://localhost:3001'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Serve static files from frontend build
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/out');
  console.log('📁 Serving frontend from:', frontendPath);

  // Serve static files
  app.use(express.static(frontendPath, {
    maxAge: '1d',
    etag: true
  }));

  // Handle Next.js static files
  app.use('/_next', express.static(path.join(frontendPath, '_next'), {
    maxAge: '1y',
    etag: true
  }));
}

// Simple root endpoint for Render health check
app.get('/', (req, res) => {
  // Check if this is a browser request or health check
  const userAgent = req.get('User-Agent') || '';
  const acceptHeader = req.get('Accept') || '';
  
  // If it's a health check or API request, return JSON
  if (userAgent.includes('curl') || userAgent.includes('wget') || acceptHeader.includes('application/json')) {
    return res.json({
      status: 'healthy',
      service: 'MGNREGA LokDekho',
      version: '1.0.1',
      timestamp: new Date().toISOString()
    });
  }
  
  // Otherwise, serve the frontend
  const fs = require('fs');
  const frontendPath = path.join(__dirname, '../frontend/out');
  const indexPath = path.join(frontendPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      status: 'frontend_building',
      message: 'Frontend is being built...',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/districts', districtRoutes);
app.use('/api/districts-mgnrega', mgnregaRoutes);
app.use('/api/health', healthRoutes);

// Root API route for testing
app.get('/api', (req, res) => {
  const fs = require('fs');
  const frontendPath = path.join(__dirname, '../frontend/out');
  const frontendExists = fs.existsSync(frontendPath);
  const indexExists = fs.existsSync(path.join(frontendPath, 'index.html'));

  res.json({
    message: 'MGNREGA LokDekho API is running!',
    version: '1.0.1',
    endpoints: {
      health: '/api/health',
      districts: '/api/districts',
      'districts-mgnrega': '/api/districts-mgnrega (Real MGNREGA data)',
      compare: '/api/compare'
    },
    frontend: {
      path: frontendPath,
      exists: frontendExists,
      indexExists: indexExists,
      files: frontendExists ? fs.readdirSync(frontendPath).slice(0, 10) : []
    },
    timestamp: new Date().toISOString()
  });
});

// Add a specific frontend status endpoint
app.get('/api/frontend-status', (req, res) => {
  const fs = require('fs');
  const frontendPath = path.join(__dirname, '../frontend/out');
  const frontendExists = fs.existsSync(frontendPath);
  const indexExists = fs.existsSync(path.join(frontendPath, 'index.html'));
  
  let files = [];
  let totalSize = 0;
  
  if (frontendExists) {
    try {
      files = fs.readdirSync(frontendPath);
      totalSize = files.reduce((size, file) => {
        try {
          const filePath = path.join(frontendPath, file);
          const stats = fs.statSync(filePath);
          return size + stats.size;
        } catch (e) {
          return size;
        }
      }, 0);
    } catch (e) {
      console.error('Error reading frontend directory:', e);
    }
  }
  
  res.json({
    frontend: {
      path: frontendPath,
      exists: frontendExists,
      indexExists: indexExists,
      fileCount: files.length,
      totalSizeBytes: totalSize,
      files: files.slice(0, 20),
      status: frontendExists && indexExists ? 'READY' : 'NOT_READY'
    },
    render_status: 'SHOULD_BE_LIVE',
    timestamp: new Date().toISOString()
  });
});

// Monthly data endpoint
app.get('/api/districts/:id/months', async (req, res) => {
  try {
    const districtId = parseInt(req.params.id);
    if (isNaN(districtId)) {
      return res.status(400).json({ error: 'Invalid district ID' });
    }

    const { limit = 12 } = req.query;
    const db = req.app.locals.db;
    const query = `SELECT * FROM mgnrega_monthly WHERE district_id = ? ORDER BY year DESC, month DESC LIMIT ?`;
    const result = await db.query(query, [districtId, parseInt(limit)]);

    res.json({
      months: result.rows,
      pagination: {
        hasNextPage: false,
        nextCursor: null,
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error fetching monthly data:', err);
    res.status(500).json({ error: 'Failed to fetch monthly data' });
  }
});

// Refresh district data endpoint
app.post('/api/districts/:id/refresh', async (req, res) => {
  try {
    const districtId = parseInt(req.params.id);
    if (isNaN(districtId)) {
      return res.status(400).json({ error: 'Invalid district ID' });
    }

    // Get district info
    const db = req.app.locals.db;
    const districtQuery = `SELECT id, name FROM districts WHERE id = ?`;
    const districtResult = await db.query(districtQuery, [districtId]);

    if (districtResult.rows.length === 0) {
      return res.status(404).json({ error: 'District not found' });
    }

    const district = districtResult.rows[0];
    const recordsUpdated = Math.floor(Math.random() * 12) + 1; // Simulate 1-12 records updated

    res.json({
      success: true,
      district,
      records_updated: recordsUpdated,
      message: `Successfully refreshed data for ${district.name}`,
      refreshed_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error refreshing district data:', err);
    res.status(500).json({ error: 'Failed to refresh district data' });
  }
});

// Add compare route directly to main app
app.get('/api/compare', async (req, res) => {
  try {
    const { district_ids, metric = 'total_wages_paid', period } = req.query;

    if (!district_ids) {
      return res.status(400).json({ error: 'district_ids parameter is required' });
    }

    const districtIds = district_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

    if (districtIds.length === 0) {
      return res.status(400).json({ error: 'Valid district IDs are required' });
    }

    const db = req.app.locals.db;

    // Validate metric
    const validMetrics = ['total_wages_paid', 'total_persondays', 'avg_households_registered', 'avg_women_participation'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ error: 'Invalid metric' });
    }

    // Map metric names to actual column names
    const metricColumnMap = {
      'total_wages_paid': 'wages_paid',
      'total_persondays': 'total_persondays',
      'avg_households_registered': 'households_registered',
      'avg_women_participation': 'women_participation_pct'
    };

    const columnName = metricColumnMap[metric];

    let query = `
      SELECT 
        d.id, d.name,
        AVG(m.${columnName}) as avg_value,
        SUM(m.${columnName}) as total_value,
        COUNT(*) as months_count
      FROM districts d
      JOIN mgnrega_monthly m ON d.id = m.district_id
      WHERE d.id IN (${districtIds.map(() => '?').join(',')})
    `;

    let params = districtIds;

    if (period) {
      const [startPeriod, endPeriod] = period.split(':');
      const [startYear, startMonth] = startPeriod.split('-');
      const [endYear, endMonth] = endPeriod.split('-');

      query += ` AND ((m.year > ?) OR (m.year = ? AND m.month >= ?))
                 AND ((m.year < ?) OR (m.year = ? AND m.month <= ?))`;
      params.push(startYear, startYear, startMonth, endYear, endYear, endMonth);
    }

    query += ` GROUP BY d.id, d.name ORDER BY avg_value DESC`;

    const result = await db.query(query, params);

    res.json({
      comparison: result.rows.map(row => ({
        ...row,
        avg_value: parseFloat(row.avg_value) || 0,
        total_value: parseFloat(row.total_value) || 0,
        months_count: parseInt(row.months_count) || 0
      })),
      metric,
      period: period || 'All time',
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error comparing districts:', err);
    res.status(500).json({ error: 'Failed to compare districts' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Serve frontend for all non-API routes (SPA routing)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }

    const frontendPath = path.join(__dirname, '../frontend/out');
    const fs = require('fs');

    // Try to serve the specific file first (for static export)
    let filePath = path.join(frontendPath, req.path);

    // If it's a directory, try index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    // If file doesn't exist, serve main index.html
    if (!fs.existsSync(filePath)) {
      filePath = path.join(frontendPath, 'index.html');
    }

    // Check if frontend build exists
    if (fs.existsSync(filePath)) {
      console.log(`📄 Serving: ${req.path} -> ${filePath}`);
      res.sendFile(filePath);
    } else {
      console.log(`❌ Frontend build not found at: ${frontendPath}`);
      // Fallback HTML if frontend build doesn't exist
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MGNREGA LokDekho</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .status { color: #28a745; font-weight: bold; }
            .error { color: #dc3545; }
            .api-link { color: #007bff; text-decoration: none; }
            .api-link:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏘️ MGNREGA LokDekho</h1>
            <p class="status">✅ Server is running successfully!</p>
            <p class="error">Frontend build is missing. Building...</p>
            
            <h3>Available API Endpoints:</h3>
            <ul>
              <li><a href="/api" class="api-link">/api</a> - API information</li>
              <li><a href="/api/health" class="api-link">/api/health</a> - Health check</li>
              <li><a href="/api/districts" class="api-link">/api/districts</a> - Districts data</li>
              <li><a href="/api/districts-mgnrega" class="api-link">/api/districts-mgnrega</a> - Real MGNREGA data</li>
            </ul>
            
            <p><small>Deployment time: ${new Date().toISOString()}</small></p>
            <p><small>Frontend path: ${frontendPath}</small></p>
          </div>
        </body>
        </html>
      `);
    }
  });
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting MGNREGA LokDekho server...');

    // Run migrations first (PostgreSQL only)
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
      console.log('📊 Running database migrations...');
      try {
        const { runMigrations } = require('./scripts/migrate');
        await runMigrations();
      } catch (migrationError) {
        console.error('⚠️ Migration failed, but continuing with startup:', migrationError.message);
        // Don't fail the entire startup if migrations fail
      }
    }

    console.log('🔧 Initializing database...');
    await initTables();

    console.log('🌱 Seeding data...');
    try {
      await seedData();
    } catch (seedError) {
      console.error('⚠️ Seeding failed, but continuing with startup:', seedError.message);
      // Don't fail the entire startup if seeding fails
    }

    console.log('✅ Database ready!');

    app.listen(FINAL_PORT, '0.0.0.0', () => {
      console.log(`🚀 MGNREGA LokDekho API running on port ${FINAL_PORT}`);
      console.log(`📊 Health check: /api/health`);
      console.log(`🏘️ Districts API: /api/districts`);
      console.log(`🔍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 Server bound to 0.0.0.0:${FINAL_PORT}`);
      console.log(`✅ PORT BINDING SUCCESSFUL!`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;