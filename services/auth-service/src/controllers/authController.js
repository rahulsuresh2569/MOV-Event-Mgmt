const authService = require('../services/authService');
const { successResponse } = require('../../../shared/utils/responseFormatter');
const { HTTP_STATUS } = require('../../../shared/constants/httpStatus');
const { registerSchema, loginSchema } = require('../validators/authValidator');

class AuthController {
  /**
   * Register a new user
   * POST /api/v1/register
   */
  async register(req, res, next) {
    try {
      // Validate request body
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        error.isJoi = true;
        throw error;
      }

      const user = await authService.register(value);

      return successResponse(res, HTTP_STATUS.CREATED, 'User registered successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/v1/login
   */
  async login(req, res, next) {
    try {
      // Validate request body
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        error.isJoi = true;
        throw error;
      }

      const result = await authService.login(value.email, value.password);

      return successResponse(res, HTTP_STATUS.OK, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/me
   */
  async getProfile(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.id);

      return successResponse(res, HTTP_STATUS.OK, 'Profile retrieved successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify token
   * GET /api/v1/verify
   */
  async verifyToken(req, res, next) {
    try {
      return successResponse(res, HTTP_STATUS.OK, 'Token is valid', { user: req.user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
