const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatus');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Global error handler middleware
 * Catches all errors and sends standardized error responses
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);

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
  errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Route not found', ERROR_CODES.NOT_FOUND);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
