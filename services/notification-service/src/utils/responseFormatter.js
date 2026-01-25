/**
 * Formats a successful API response
 * @param {*} data - The response data
 * @param {string} message - Optional success message
 * @returns {Object} Formatted response object
 */
const formatSuccess = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data
  };
};

/**
 * Formats an error API response
 * @param {string} message - Error message
 * @param {Error|Object} error - Optional error object
 * @returns {Object} Formatted error response object
 */
const formatError = (message, error = null) => {
  const response = {
    success: false,
    message
  };

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      response.error = {
        message: error.message || error,
        stack: error.stack
      };
    } else {
      response.error = error.message || error;
    }
  }

  return response;
};

module.exports = {
  formatSuccess,
  formatError
};
