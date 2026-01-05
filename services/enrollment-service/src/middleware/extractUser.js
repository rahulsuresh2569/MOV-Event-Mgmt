const logger = require('../utils/logger');

/**
 * Extract user information from API Gateway headers
 * The API Gateway verifies JWT and forwards user info in headers
 */
const extractUser = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userEmail = req.headers['x-user-email'];
  const userRole = req.headers['x-user-role'];

  if (userId && userEmail && userRole) {
    req.user = {
      id: parseInt(userId, 10),
      email: userEmail,
      role: userRole,
    };
    logger.info(`User authenticated: ${userEmail} (${userRole})`);
  }

  next();
};

module.exports = { extractUser };
