/**
 * Middleware to extract user info from gateway headers
 * Gateway forwards user info after JWT verification
 */
const extractUserFromHeaders = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userEmail = req.headers['x-user-email'];
  const userRole = req.headers['x-user-role'];

  if (userId && userEmail && userRole) {
    req.user = {
      id: parseInt(userId, 10),
      email: userEmail,
      role: userRole,
    };
    console.log('[Auth Service] User authenticated:', {
      userId: req.user.id,
      role: req.user.role
    });
  }
  // No logging for public routes (missing headers is expected)

  next();
};

module.exports = {
  extractUserFromHeaders,
};
