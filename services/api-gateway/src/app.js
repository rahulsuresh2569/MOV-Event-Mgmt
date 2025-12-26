const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
};
app.use(cors(corsOptions));

// Request logging
app.use(morgan('combined', { stream: { write: (message) => logger.http(message.trim()) } }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Gateway is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API version
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MOV Event Management API Gateway',
    version: '1.0.0',
    services: {
      auth: '/api/v1/auth',
      events: '/api/v1/events',
      enrollments: '/api/v1/enrollments',
      chat: '/api/v1/chat',
      notifications: '/api/v1/notifications',
    },
  });
});

// Proxy configuration
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'warn',
  onError: (err, req, res) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      error: err.message,
    });
  },
};

// Auth Service proxy
app.use(
  '/api/v1/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    pathRewrite: { '^/api/v1/auth': '/api/v1' },
    ...proxyOptions,
  })
);

// Event Service proxy
app.use(
  '/api/v1/events',
  createProxyMiddleware({
    target: process.env.EVENT_SERVICE_URL,
    pathRewrite: { '^/api/v1/events': '/api/v1' },
    ...proxyOptions,
  })
);

// Enrollment Service proxy (to be implemented in MS3)
app.use(
  '/api/v1/enrollments',
  createProxyMiddleware({
    target: process.env.ENROLLMENT_SERVICE_URL,
    pathRewrite: { '^/api/v1/enrollments': '/api/v1' },
    ...proxyOptions,
  })
);

// Chat Service proxy (to be implemented in MS4)
app.use(
  '/api/v1/chat',
  createProxyMiddleware({
    target: process.env.CHAT_SERVICE_URL,
    pathRewrite: { '^/api/v1/chat': '/api/v1' },
    ...proxyOptions,
  })
);

// Notification Service proxy (to be implemented in MS4)
app.use(
  '/api/v1/notifications',
  createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL,
    pathRewrite: { '^/api/v1/notifications': '/api/v1' },
    ...proxyOptions,
  })
);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
