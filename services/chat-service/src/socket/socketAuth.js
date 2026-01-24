const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token from socket handshake
 */
const socketAuth = (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      logger.warn(`Socket connection rejected: No token provided`);
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to socket
    socket.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    logger.info(`Socket authenticated: User ${socket.user.id} (${socket.user.email})`);
    next();
  } catch (error) {
    logger.error(`Socket authentication failed: ${error.message}`);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuth;
