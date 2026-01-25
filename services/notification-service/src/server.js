require('dotenv').config();
const { server, initializeServices } = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3005;

const startServer = async () => {
  try {
    // Initialize all services (DB, Redis, Event Bus)
    await initializeServices();

    // Start HTTP and Socket.IO server
    server.listen(PORT, () => {
      logger.info(`Notification service started successfully`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      });
      
      console.log(`
╔═══════════════════════════════════════════════════╗
║   MOV Notification Service                        ║
║   Port: ${PORT}                                    ║
║   Environment: ${process.env.NODE_ENV || 'development'}                       ║
║   Status: Running                                 ║
╚═══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start notification service', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

startServer();
