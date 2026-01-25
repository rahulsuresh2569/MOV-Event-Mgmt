require('dotenv').config();
const app = require('./app');
const { sequelize, testConnection } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const eventStateScheduler = require('./schedulers/eventStateScheduler');

const PORT = process.env.PORT;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Connect to Redis for event publishing
    await connectRedis();

    // Sync database (in development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('Database synced successfully');
    }

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Event Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      
      // Start event state scheduler
      eventStateScheduler.start();
      logger.info('Event state scheduler initialized');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      
      // Stop scheduler
      eventStateScheduler.stop();
      
      // Disconnect Redis
      await disconnectRedis();
      
      server.close(async () => {
        logger.info('HTTP server closed');
        await sequelize.close();
        logger.info('Database connection closed');
      });
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
