const jwt = require('jsonwebtoken');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatus');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * In-memory token blacklist (revoked tokens)
 * NOTE: Clears if API Gateway restarts. (Good for demo/marks; persistent version needs Redis.)
 */
const revokedTokens = new Map(); // token -> expiresAtMs

const cleanupRevoked = () => {
  if (revokedTokens.size === 0) return;

  const now = Date.now();
  for (const [token, expMs] of revokedTokens.entries()) {
    if (!expMs || expMs <= now) revokedTokens.delete(token);
  }
};

// Clean up every minute (safe for Docker / Node)
setInterval(cleanupRevoked, 60 * 1000).unref();

/**
 * Extract Bearer token safely
 */
const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
};

/**
 * Revoke token until its JWT expiry
 */
const revokeToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    const expMs = decoded?.exp ? decoded.exp * 1000 : Date.now() + 60 * 60 * 1000;
    revokedTokens.set(token, expMs);
  } catch (e) {
    revokedTokens.set(token, Date.now() + 60 * 60 * 1000);
  }
};

/**
 * Check if token is revoked
 */
const isTokenRevoked = (token) => {
  const expMs = revokedTokens.get(token);
  if (!expMs) return false;

  if (Date.now() >= expMs) {
    revokedTokens.delete(token);
    return false;
  }
  return true;
};

/**
 * Middleware to verify JWT token
 * Expects token in Authorization header: Bearer <token>
 */
const verifyToken = (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'No token provided',
        ERROR_CODES.AUTHENTICATION_ERROR
      );
    }

    // ✅ Secure Logout check (blacklist)
    if (isTokenRevoked(token)) {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Token revoked (logged out)',
        ERROR_CODES.AUTHENTICATION_ERROR
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // ✅ IMPORTANT: keep token for logout route
    req.token = token;

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

/**
 * Optional authentication middleware
 * Extracts user info if token is present, but doesn't fail if missing/invalid/revoked
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (token && !isTokenRevoked(token)) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      } catch (e) {
        // ignore invalid token
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Forward user context to backend services
 */
const forwardUserContext = (proxyReq, req, res) => {
  if (req.user) {
    proxyReq.setHeader('X-User-Id', req.user.id);
    proxyReq.setHeader('X-User-Email', req.user.email);
    proxyReq.setHeader('X-User-Role', req.user.role);
  }
};

module.exports = {
  verifyToken,
  requireRole,
  optionalAuth,
  forwardUserContext,
  revokeToken,
  isTokenRevoked,
};
