const logger = require('./logger');

/**
 * Validates required environment variables
 */
const validateEnv = () => {
  const required = [
    'PORT',
    'MONGODB_URI',
    'REDIS_URL',
    'JWT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables', {
      missing
    });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  logger.info('Environment variables validated successfully');
};

/**
 * Get configuration values
 */
const getConfig = () => {
  return {
    port: parseInt(process.env.PORT) || 3005,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI,
    redisUrl: process.env.REDIS_URL,
    jwtSecret: process.env.JWT_SECRET,
    corsOrigins: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    retentionDays: parseInt(process.env.NOTIFICATION_RETENTION_DAYS) || 90,
    logLevel: process.env.LOG_LEVEL || 'info'
  };
};

module.exports = {
  validateEnv,
  getConfig
};
