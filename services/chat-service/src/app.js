const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const logger = require('./utils/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { extractUser } = require('./middleware/extractUser');

// Import routes
const chatRoutes = require('./routes/chatRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');

// Import Socket.IO handlers
const setupSocketHandlers = require('./socket/socketHandler');

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

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

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Check if the chat service is running and get socket connection count
 *     responses:
 *       200:
 *         description: Service is healthy
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
 *                   example: Chat Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 socketConnections:
 *                   type: integer
 *                   example: 5
 */
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chat Service is healthy',
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount,
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MOV Chat Service API Docs',
}));

// OpenAPI JSON endpoint
app.get('/api-docs-json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /socket.io:
 *   get:
 *     summary: WebSocket Connection Information
 *     tags: [WebSocket]
 *     description: |
 *       Real-time WebSocket connection endpoint using Socket.IO.
 *       
 *       ## Connection
 *       Connect to `ws://localhost:3004` or `ws://localhost:3000/socket.io` (via gateway) using Socket.IO client.
 *       
 *       ## Authentication
 *       Include JWT token in connection query: `?token=YOUR_JWT_TOKEN`
 *       
 *       ## Client Events (Emit from client)
 *       
 *       ### join-event-room
 *       Join an event chat room to receive and send group messages.
 *       ```json
 *       { "eventId": 10 }
 *       ```
 *       
 *       ### send-group-message
 *       Send a message to an event group chat.
 *       ```json
 *       { "eventId": 10, "content": "Hello everyone!" }
 *       ```
 *       
 *       ### send-direct-message
 *       Send a direct message to another user.
 *       ```json
 *       { "receiverId": 2, "content": "Hi there!" }
 *       ```
 *       
 *       ### typing-start
 *       Notify that user started typing (in event room or direct chat).
 *       ```json
 *       { "eventId": 10 } or { "receiverId": 2 }
 *       ```
 *       
 *       ### typing-stop
 *       Notify that user stopped typing.
 *       ```json
 *       { "eventId": 10 } or { "receiverId": 2 }
 *       ```
 *       
 *       ## Server Events (Listen from client)
 *       
 *       ### user-joined
 *       Received when a user joins an event room.
 *       ```json
 *       { "userId": 1, "userName": "John Doe" }
 *       ```
 *       
 *       ### new-group-message
 *       Received when a new group message is sent.
 *       ```json
 *       { "message": { "_id": "...", "senderId": 1, "content": "...", ... } }
 *       ```
 *       
 *       ### new-direct-message
 *       Received when a direct message is sent to you.
 *       ```json
 *       { "message": { "_id": "...", "senderId": 1, "content": "...", ... } }
 *       ```
 *       
 *       ### user-typing
 *       Received when a user starts typing.
 *       ```json
 *       { "userId": 1, "userName": "John Doe" }
 *       ```
 *       
 *       ### user-stopped-typing
 *       Received when a user stops typing.
 *       ```json
 *       { "userId": 1 }
 *       ```
 *       
 *       ### error
 *       Received when an error occurs.
 *       ```json
 *       { "message": "Error description" }
 *       ```
 *     responses:
 *       101:
 *         description: Switching Protocols - WebSocket connection established
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 */

// Extract user context from gateway headers
app.use(extractUser);

// API routes
app.use('/api/v1', chatRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);

// Setup Socket.IO event handlers
setupSocketHandlers(io);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Export both app and server
module.exports = { app, server, io };
