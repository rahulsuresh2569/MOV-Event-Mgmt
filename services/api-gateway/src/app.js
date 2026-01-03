const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
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

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MOV Event Management API Docs',
}));

// OpenAPI JSON endpoint
app.get('/api-docs-json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
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

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: organizer@test.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [ORGANIZER, PARTICIPANT]
 *                 example: ORGANIZER
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Public routes (no auth needed)
app.use(
  '/api/v1/auth/register',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    pathRewrite: { '^/api/v1/auth': '/api/v1' },
    ...proxyOptions,
  })
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user and receive JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: organizer@test.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.use(
  '/api/v1/auth/login',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    pathRewrite: { '^/api/v1/auth': '/api/v1' },
    ...proxyOptions,
  })
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Planning, Published, Running, Completed, Canceled]
 *         description: Filter by event status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by event category
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Events retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 */
// Public routes (viewing events - no authentication required)
app.get(
  '/api/v1/events',
  createProxyMiddleware({
    target: process.env.EVENT_SERVICE_URL,
    pathRewrite: { '^/api/v1/events': '/' },  // Rewrite to root
    ...proxyOptions,
  })
);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Event retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     event:
 *                       $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get(
  '/api/v1/events/:id',
  createProxyMiddleware({
    target: process.env.EVENT_SERVICE_URL,
    pathRewrite: { '^/api/v1/events': '/' },  // Rewrite to root
    ...proxyOptions,
  })
);

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - location
 *               - date
 *               - maxParticipants
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: Tech Conference 2025
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Annual technology conference featuring latest innovations
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 example: Technology
 *               location:
 *                 type: string
 *                 maxLength: 255
 *                 example: Berlin Convention Center
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Event date and time (must be in the future)
 *                 example: 2025-03-15T09:00:00.000Z
 *               maxParticipants:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10000
 *                 example: 500
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Event created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     event:
 *                       $ref: '#/components/schemas/Event'
 *       401:
 *         description: Unauthorized - Token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - ORGANIZER role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/events/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Event date (must be in the future)
 *               location:
 *                 type: string
 *                 maxLength: 255
 *               maxParticipants:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10000
 *               category:
 *                 type: string
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       403:
 *         description: Only organizer can update this event
 *       404:
 *         description: Event not found
 *
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       400:
 *         description: Can only delete events in Planning status
 *       403:
 *         description: Only organizer can delete this event
 *       404:
 *         description: Event not found
 *
 * /api/v1/events/organizer/me:
 *   get:
 *     summary: Get all events created by the authenticated organizer
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organizer's events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *
 * /api/v1/events/{id}/status:
 *   patch:
 *     summary: Change event status
 *     description: Transition event through its lifecycle (Planning → Published → Running → Completed or Planning → Canceled)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Planning, Published, Running, Completed, Canceled]
 *                 description: Target status for the event
 *           example:
 *             status: "Published"
 *     responses:
 *       200:
 *         description: Event status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Only organizer can change event status
 *       404:
 *         description: Event not found
 */
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
