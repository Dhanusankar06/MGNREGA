const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mgnrega-api' },
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/mgnrega/error.log', 
      level: 'error',
      handleExceptions: true 
    }),
    new winston.transports.File({ 
      filename: '/var/log/mgnrega/combined.log',
      handleExceptions: true 
    }),
  ],
});

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;