const { successResponse } = require('../utils/responseFormatter');
const { HTTP_STATUS } = require('../constants/httpStatus');
const { revokeToken } = require('../middleware/authMiddleware');

class AuthController {
  /**
   * POST /api/v1/auth/logout
   * Revoke current JWT token (secure logout)
   */
  logout(req, res) {
    // req.token is set by verifyToken middleware
    const token = req.token;

    if (token) {
      revokeToken(token);
    }

    return successResponse(res, HTTP_STATUS.OK, 'Logout successful');
  }
}

module.exports = new AuthController();
