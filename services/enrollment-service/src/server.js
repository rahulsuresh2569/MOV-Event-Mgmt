require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3003;

// Connect to database
connectDB();

// Connect to Redis for event publishing
connectRedis();

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Enrollment Service running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Event Service URL: ${process.env.EVENT_SERVICE_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await disconnectRedis();
  process.exit(0);
});
