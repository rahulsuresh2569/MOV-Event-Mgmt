const { HTTP_STATUS } = require('../constants/httpStatus');

/**
 * Standard API response formatter
 */
const successResponse = (
  res,
  statusCode = HTTP_STATUS.OK,
  message = 'Success',
  data = null
) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
    requestId: res.getHeader('X-Request-Id') || 'N/A',
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response formatter
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
    timestamp: new Date().toISOString(),
    requestId: res.getHeader('X-Request-Id') || 'N/A',
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
