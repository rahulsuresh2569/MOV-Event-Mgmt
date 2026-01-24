const logger = require('../utils/logger');

/**
 * Extract user information from headers set by API Gateway
 * This middleware reads user context forwarded by the gateway
 */
const extractUser = (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const userEmail = req.headers['x-user-email'];
    const userRole = req.headers['x-user-role'];

    if (userId && userEmail && userRole) {
      req.user = {
        id: parseInt(userId, 10),
        email: userEmail,
        role: userRole,
      };
      logger.debug(`User extracted from headers: ${userId} (${userRole})`);
    } else {
      req.user = null;
      logger.debug('No user context in headers');
    }

    next();
  } catch (error) {
    logger.error(`Error extracting user from headers: ${error.message}`);
    req.user = null;
    next();
  }
};

/**
 * Require authentication - throws error if no user context
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    error.errorCode = 'AUTHENTICATION_ERROR';
    return next(error);
  }
  next();
};

module.exports = {
  extractUser,
  requireAuth,
};
