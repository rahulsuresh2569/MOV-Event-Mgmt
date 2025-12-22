const { HTTP_STATUS } = require('../constants/httpStatus');

/**
 * Standard API response formatter
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Response message
 * @param {Object} data - Response data
 */
const successResponse = (res, statusCode = HTTP_STATUS.OK, message = 'Success', data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {String} errorCode - Error code
 * @param {Object} errors - Validation errors
 */
const errorResponse = (
  res,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message = 'Internal server error',
  errorCode = null,
  errors = null
) => {
  const response = {
    success: false,
    message,
  };

  if (errorCode) {
    response.errorCode = errorCode;
  }

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse,
};
