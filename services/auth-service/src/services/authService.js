const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../constants/httpStatus');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: userData.email } });
      if (existingUser) {
        const error = new Error('User with this email already exists');
        error.statusCode = HTTP_STATUS.CONFLICT;
        error.errorCode = ERROR_CODES.DUPLICATE_ENTRY;
        throw error;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await User.create({
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });

      logger.info(`New user registered: ${user.email}`);

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    } catch (error) {
      logger.error(`Registration error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Login user and generate JWT token
   */
  async login(email, password) {
    try {
      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        const error = new Error('Invalid credentials');
        error.statusCode = HTTP_STATUS.UNAUTHORIZED;
        error.errorCode = ERROR_CODES.AUTHENTICATION_ERROR;
        throw error;
      }

      // Check if user is active
      if (!user.isActive) {
        const error = new Error('Account is deactivated');
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.errorCode = ERROR_CODES.AUTHORIZATION_ERROR;
        throw error;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        const error = new Error('Invalid credentials');
        error.statusCode = HTTP_STATUS.UNAUTHORIZED;
        error.errorCode = ERROR_CODES.AUTHENTICATION_ERROR;
        throw error;
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      logger.info(`User logged in: ${user.email}`);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'role', 'firstName', 'lastName', 'isActive'],
      });

      if (!user) {
        const error = new Error('User not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        error.errorCode = ERROR_CODES.NOT_FOUND;
        throw error;
      }

      return user;
    } catch (error) {
      logger.error(`Get user error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      logger.error(`Token verification error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new AuthService();
