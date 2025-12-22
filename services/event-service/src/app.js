const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('../../shared/utils/logger');
const { notFoundHandler, errorHandler } = require('../../shared/middleware/errorHandler');
const eventRoutes = require('./routes/eventRoutes');

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Event Service is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/v1', eventRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
