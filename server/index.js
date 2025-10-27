const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Use SQLite for local development
const { db, initTables, seedData } = require('./db/sqlite');

const districtRoutes = require('./routes/districts-simple');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3002;

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
    ? ['https://yourdomain.com'] 
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

// Routes
app.use('/api/districts', districtRoutes);
app.use('/api/health', healthRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('Initializing database...');
    await initTables();
    console.log('Seeding sample data...');
    await seedData();
    console.log('Database ready!');
    
    app.listen(PORT, () => {
      console.log(`🚀 MGNREGA LokDekho API running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🏘️ Districts API: http://localhost:${PORT}/api/districts`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;