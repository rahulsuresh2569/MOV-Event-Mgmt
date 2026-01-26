require('dotenv').config();
const { server } = require('./app');
const connectDB = require('./config/database');
const { initializeRedis, closeRedis } = require('./config/redis');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3004;

// Connect to MongoDB
connectDB();

// Initialize Redis
initializeRedis().catch((error) => {
  logger.error('Failed to initialize Redis:', error);
  // Don't exit - continue without Redis (notifications won't work but chat will)
});

// Start server
server.listen(PORT, () => {
  logger.info(`Chat Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`WebSocket server ready at ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await closeRedis();
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
