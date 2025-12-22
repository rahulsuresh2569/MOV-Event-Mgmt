require('dotenv').config();
const app = require('./app');
const { sequelize, testConnection } = require('./config/database');
const logger = require('../../shared/utils/logger');

const PORT = process.env.PORT || 3002;

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
      logger.info(`Event Service running on port ${PORT}`);
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
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
