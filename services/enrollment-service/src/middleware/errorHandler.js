const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatus');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Joi validation errors
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

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((error) => ({
      field: error.path,
      message: error.message,
    }));
    return errorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      'Validation error',
      ERROR_CODES.VALIDATION_ERROR,
      errors
    );
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return errorResponse(
      res,
      HTTP_STATUS.CONFLICT,
      'Resource already exists',
      ERROR_CODES.DUPLICATE_ENTRY
    );
  }

  // Custom errors with statusCode
  if (err.statusCode) {
    return errorResponse(res, err.statusCode, err.message, err.errorCode);
  }

  // Default to 500 internal server error
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

module.exports = { errorHandler, notFoundHandler };
