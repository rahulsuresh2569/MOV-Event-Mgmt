const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Socket.IO authentication middleware
 * Verifies JWT token from handshake auth or query params
 */
const authenticateSocket = (socket, next) => {
  try {
    // Try to get token from auth object (recommended)
    let token = socket.handshake.auth?.token;
    
    // Fallback: try query params (for compatibility)
    if (!token) {
      token = socket.handshake.query?.token;
    }

    // Fallback: try headers
    if (!token) {
      const authHeader = socket.handshake.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      logger.warn('Socket connection attempt without token', {
        socketId: socket.id,
        ip: socket.handshake.address
      });
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to socket
    socket.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    logger.info('Socket authenticated successfully', {
      socketId: socket.id,
      userId: socket.user.userId,
      role: socket.user.role
    });

    next();
  } catch (error) {
    logger.error('Socket authentication error', {
      socketId: socket.id,
      error: error.message,
      ip: socket.handshake.address
    });

    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Invalid authentication token'));
    }

    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication token expired'));
    }

    return next(new Error('Authentication failed'));
  }
};

module.exports = {
  authenticateSocket
};
