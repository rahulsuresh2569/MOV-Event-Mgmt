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
const { verifyToken, requireRole, optionalAuth, forwardUserContext } = require('./middleware/authMiddleware');

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
 *     summary: Get all events with role-based visibility filtering
 *     description: |
 *       Retrieve events with visibility rules based on authentication status and user role.
 *       
 *       **Visibility Rules:**
 *       - **Unauthenticated users**: See Published and Running events only (public discovery)
 *       - **Participants**: See Published/Running (all) + Completed/Canceled (only events they enrolled in)
 *       - **Organizers**: See all their own events (all states) + Published/Running from other organizers
 *       
 *       **Note:** Planning events are only visible to the organizer who created them.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Planning, Published, Running, Completed, Canceled]
 *         description: Filter by event status (visibility rules still apply)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by event category
 *       - in: query
 *         name: organizerId
 *         schema:
 *           type: integer
 *         description: Filter by organizer ID
 *     responses:
 *       200:
 *         description: Events retrieved successfully (filtered by visibility rules)
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
// Public routes (viewing events - optional authentication for personalized results)
app.get(
  '/api/v1/events',
  optionalAuth, // Extract user context if token present, but don't require it
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
 *     description: Retrieve a specific event by ID. Authentication is optional. Visibility rules apply based on user role and event state.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *       - {}
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
  optionalAuth, // Extract user context if token present, but don't require it
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
 *               - startDate
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
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Event start date and time (must be in the future)
 *                 example: 2025-03-15T09:00:00.000Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Event end date and time (optional, must be after start date). Required for automatic state transitions.
 *                 example: 2025-03-15T17:00:00.000Z
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
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Event start date (must be in the future)
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Event end date (optional, must be after start date)
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
 *
 * /api/v1/enrollments:
 *   post:
 *     summary: Enroll in an event
 *     description: Register the authenticated user for a published event
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Enrolled successfully
 *       400:
 *         description: Event not in Published state or capacity full
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       409:
 *         description: Already enrolled
 *
 * /api/v1/enrollments/me:
 *   get:
 *     summary: Get user's enrollments
 *     description: Retrieve all active enrollments for the authenticated user
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
 *       401:
 *         description: Unauthorized
 *
 * /api/v1/enrollments/{eventId}:
 *   delete:
 *     summary: Unenroll from an event
 *     description: Cancel enrollment for a published event
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Unenrolled successfully
 *       400:
 *         description: Event not in Published state
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not enrolled or event not found
 *
 * /api/v1/enrollments/event/{eventId}/statistics:
 *   get:
 *     summary: Get event statistics
 *     description: |
 *       Retrieve comprehensive statistics for an event including registration metrics, 
 *       capacity utilization, and cancellation data. Only the event organizer can access this.
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                   example: Event statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     eventId:
 *                       type: integer
 *                       example: 1
 *                     eventTitle:
 *                       type: string
 *                       example: Tech Conference 2026
 *                     eventStatus:
 *                       type: string
 *                       enum: [Planning, Published, Running, Completed, Canceled]
 *                       example: Published
 *                     eventDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-02-15T09:00:00.000Z
 *                     registrations:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: Total number of registrations (active + canceled)
 *                           example: 45
 *                         active:
 *                           type: integer
 *                           description: Current number of active enrollments
 *                           example: 38
 *                         canceled:
 *                           type: integer
 *                           description: Number of canceled enrollments
 *                           example: 7
 *                         cancellationRate:
 *                           type: number
 *                           format: float
 *                           description: Percentage of users who canceled (0-100)
 *                           example: 15.56
 *                     capacity:
 *                       type: object
 *                       properties:
 *                         max:
 *                           type: integer
 *                           description: Maximum capacity of the event
 *                           example: 50
 *                         current:
 *                           type: integer
 *                           description: Current number of participants
 *                           example: 38
 *                         available:
 *                           type: integer
 *                           description: Number of available spots
 *                           example: 12
 *                         utilizationRate:
 *                           type: number
 *                           format: float
 *                           description: Percentage of capacity filled (0-100)
 *                           example: 76.0
 *       401:
 *         description: Unauthorized - Token required
 *       403:
 *         description: Forbidden - Only event organizer can view statistics
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
    pathRewrite: { '^/api/v1/enrollments': '' },
    ...proxyOptions,
  })
);

// ============= CHAT SERVICE ROUTES =============

/**
 * @swagger
 * /api/v1/chat/conversations:
 *   get:
 *     summary: Get user's conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve all conversations for the authenticated user (both direct and group conversations)
 *     responses:
 *       200:
 *         description: List of conversations
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
 *                   example: Conversations retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Conversation'
 *                     totalCount:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */

/**
 * @swagger
 * /api/v1/chat/conversations/direct/{userId}:
 *   get:
 *     summary: Get direct conversation with specific user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     description: Get or create a direct conversation between authenticated user and another user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the other user
 *         example: 2
 *     responses:
 *       200:
 *         description: Direct conversation retrieved or created
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
 *                   example: Direct conversation retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversation:
 *                       $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/v1/chat/conversations/{id}/messages:
 *   get:
 *     summary: Get messages for a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve all messages for a specific conversation with pagination
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                   example: Messages retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalMessages:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not part of this conversation
 *       404:
 *         description: Conversation not found
 */

/**
 * @swagger
 * /api/v1/chat/events/{eventId}/messages:
 *   get:
 *     summary: Get event group chat messages
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve all messages for an event group chat (requires user to be organizer or enrolled participant)
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *         example: 10
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Event messages retrieved successfully
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
 *                   example: Event messages retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalMessages:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not authorized to view these messages
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /api/v1/chat/messages/mark-read:
 *   post:
 *     summary: Mark all messages in a conversation as read
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     description: Mark all unread messages in a conversation as read for the authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *             properties:
 *               conversationId:
 *                 type: string
 *                 description: MongoDB ObjectId of the conversation
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
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
 *                   example: Messages marked as read
 *                 data:
 *                   type: object
 *                   properties:
 *                     markedCount:
 *                       type: integer
 *                       description: Number of messages marked as read
 *                       example: 5
 *       400:
 *         description: Bad request - Conversation ID is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found

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
