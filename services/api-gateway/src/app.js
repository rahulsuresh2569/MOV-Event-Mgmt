const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { verifyToken, requireRole, forwardUserContext } = require('./middleware/authMiddleware');

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

// Note: Body parsing is NOT needed in API Gateway as we're just proxying requests
// The backend services will handle body parsing themselves

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
  onProxyReq: forwardUserContext, // Forward user context to backend services
  onError: (err, req, res) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      error: err.message,
    });
  },
};

// ============= AUTH SERVICE ROUTES =============
// Public routes (no auth needed)
app.use(
  '/api/v1/auth/register',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    pathRewrite: { '^/api/v1/auth': '/api/v1' },
    ...proxyOptions,
  })
);

app.use(
  '/api/v1/auth/login',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    pathRewrite: { '^/api/v1/auth': '/api/v1' },
    ...proxyOptions,
  })
);

// Protected auth routes (require authentication)
app.use(
  '/api/v1/auth',
  verifyToken, // Verify JWT token
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    pathRewrite: { '^/api/v1/auth': '/api/v1' },
    ...proxyOptions,
  })
);

// ============= EVENT SERVICE ROUTES =============
// Public routes (viewing events - no authentication required)
app.get(
  '/api/v1/events',
  createProxyMiddleware({
    target: process.env.EVENT_SERVICE_URL,
    pathRewrite: { '^/api/v1/events': '/' },  // Rewrite to root
    ...proxyOptions,
  })
);

app.get(
  '/api/v1/events/:id',
  createProxyMiddleware({
    target: process.env.EVENT_SERVICE_URL,
    pathRewrite: { '^/api/v1/events': '/' },  // Rewrite to root
    ...proxyOptions,
  })
);

// Protected routes (creating/modifying events - ORGANIZER only)
app.use(
  '/api/v1/events',
  verifyToken, // Verify JWT token
  requireRole(['ORGANIZER']), // Only organizers can manage events
  createProxyMiddleware({
    target: process.env.EVENT_SERVICE_URL,
    pathRewrite: { '^/api/v1/events': '/' },  // Rewrite to root
    ...proxyOptions,
  })
);

// ============= ENROLLMENT SERVICE ROUTES =============
// All enrollment routes require authentication
app.use(
  '/api/v1/enrollments',
  verifyToken,
  createProxyMiddleware({
    target: process.env.ENROLLMENT_SERVICE_URL,
    pathRewrite: { '^/api/v1/enrollments': '/api/v1' },
    ...proxyOptions,
  })
);

// ============= CHAT SERVICE ROUTES =============
// All chat routes require authentication
app.use(
  '/api/v1/chat',
  verifyToken,
  createProxyMiddleware({
    target: process.env.CHAT_SERVICE_URL,
    pathRewrite: { '^/api/v1/chat': '/api/v1' },
    ...proxyOptions,
  })
);

// ============= NOTIFICATION SERVICE ROUTES =============
// All notification routes require authentication
app.use(
  '/api/v1/notifications',
  verifyToken,
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
