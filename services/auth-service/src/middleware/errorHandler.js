const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatus');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Global error handler middleware
 * Catches all errors and sends standardized error responses
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  const errorPayload = {
    service: 'auth-service',
    requestId: req.requestId || 'N/A',
    method: req.method,
    url: req.originalUrl,
    statusCode,
    errorCode: err.errorCode || ERROR_CODES.INTERNAL_ERROR,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  };

  // Normal error log (goes to console + error.log + all.log)
  logger.error(JSON.stringify(errorPayload));

  // 🚨 CRITICAL ALERT for 5xx failures (writes to alerts.log via logger.alertCritical)
  if (statusCode >= 500 && typeof logger.alertCritical === 'function') {
    logger.alertCritical(errorPayload);
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return errorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      'Validation error',
      ERROR_CODES.VALIDATION_ERROR,
      errors
    );
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    return errorResponse(
      res,
      HTTP_STATUS.CONFLICT,
      'Duplicate entry',
      ERROR_CODES.DUPLICATE_ENTRY
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

  // Joi validation error
  if (err.isJoi) {
    const errors = err.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return errorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      'Validation error',
      ERROR_CODES.VALIDATION_ERROR,
      errors
    );
  }

  // Custom application errors
  if (err.statusCode) {
    return errorResponse(res, err.statusCode, err.message, err.errorCode);
  }

  // Default server error
  return errorResponse(
    res,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    'Internal server error',
    ERROR_CODES.INTERNAL_ERROR
  );
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Route not found', ERROR_CODES.NOT_FOUND);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
