const logger = require('../utils/logger');
const { errorResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatus');

/**
 * Not Found Handler
 * Catches requests to undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  error.errorCode = ERROR_CODES.NOT_FOUND;
  next(error);
};

/**
 * Global Error Handler
 * Catches all errors and formats response
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
  });

  // Joi validation error
  if (err.isJoi) {
    const errors = err.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return errorResponse(
      res,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'Validation error',
      ERROR_CODES.VALIDATION_ERROR,
      errors
    );
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message,
    }));
    return errorResponse(
      res,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'Validation error',
      ERROR_CODES.VALIDATION_ERROR,
      errors
    );
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      'Invalid ID format',
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      'Invalid token',
      ERROR_CODES.AUTHENTICATION_ERROR
    );
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      'Token expired',
      ERROR_CODES.AUTHENTICATION_ERROR
    );
  }

  // Default error response
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  const errorCode = err.errorCode || ERROR_CODES.INTERNAL_ERROR;
  const message = err.message || 'Internal server error';

  return errorResponse(res, statusCode, message, errorCode);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
