require('dotenv').config();
const app = require('./app');
const { sequelize, testConnection } = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;

// CRITICAL alerting for runtime crashes
process.on('uncaughtException', (error) => {
  logger.error('CRITICAL: Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('CRITICAL: Unhandled Promise Rejection', { reason });
  process.exit(1);
});

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database (in development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('Database synced successfully');
    }

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Auth Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        await sequelize.close();
        logger.info('Database connection closed');
      });
    });
  } catch (error) {
    logger.error('CRITICAL: Failed to start auth-service', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();
