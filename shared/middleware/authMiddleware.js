const jwt = require('jsonwebtoken');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatus');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Middleware to verify JWT token
 * Expects token in Authorization header: Bearer <token>
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'No token provided',
        ERROR_CODES.AUTHENTICATION_ERROR
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request object
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Token expired',
        ERROR_CODES.AUTHENTICATION_ERROR
      );
    }

    return errorResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      'Invalid token',
      ERROR_CODES.AUTHENTICATION_ERROR
    );
  }
};

/**
 * Middleware to check if user has required role
 * @param {Array} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return errorResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      'Authentication required',
      ERROR_CODES.AUTHENTICATION_ERROR
    );
  }

  if (!allowedRoles.includes(req.user.role)) {
    return errorResponse(
      res,
      HTTP_STATUS.FORBIDDEN,
      'Insufficient permissions',
      ERROR_CODES.AUTHORIZATION_ERROR
    );
  }

  next();
};

module.exports = {
  verifyToken,
  requireRole,
};
