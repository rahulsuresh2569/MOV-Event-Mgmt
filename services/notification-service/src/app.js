const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const errorHandler = require('./utils/errorHandler');
const { connectDatabase } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { authenticateSocket } = require('./middleware/socketAuth');
const { initializeSocketService } = require('./services/socketService');
const { startEventBus, stopEventBus } = require('./services/eventBus');
const socketHandler = require('./socket/socketHandler');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Socket.IO configuration
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Health check endpoint (before auth)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Notification service is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/notifications', notificationRoutes);

// Socket.IO authentication middleware
io.use(authenticateSocket);

// Initialize Socket.IO handlers
socketHandler(io);

// Initialize socket service with io instance
initializeSocketService(io);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'MOV Notification Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      rest: {
        notifications: '/api/notifications',
        unreadCount: '/api/notifications/unread-count',
        markRead: '/api/notifications/:id/read',
        markAllRead: '/api/notifications/read-all',
        preferences: '/api/notifications/preferences',
        health: '/api/notifications/health'
      },
      websocket: {
        connection: 'ws://notification-service:3005',
        events: {
          client: [
            'get-notifications',
            'mark-read',
            'mark-all-read',
            'test-notification'
          ],
          server: [
            'notification',
            'initial-notifications',
            'notifications-list',
            'unread-count'
          ]
        }
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize connections
const initializeServices = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.info('MongoDB connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Start event bus (subscribe to Redis events)
    await startEventBus();
    logger.info('Event bus started successfully');

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services', { error: error.message });
    throw error;
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown`);

  try {
    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Close Socket.IO connections
    io.close(() => {
      logger.info('Socket.IO server closed');
    });

    // Stop event bus
    await stopEventBus();
    logger.info('Event bus stopped');

    // Disconnect Redis
    await disconnectRedis();
    logger.info('Redis disconnected');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: error.message });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  gracefulShutdown('unhandledRejection');
});

module.exports = { app, server, io, initializeServices };
