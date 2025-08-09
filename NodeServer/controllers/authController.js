const jwt = require('jsonwebtoken');
const User = require('../models/UserPostgres');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { JWT_SECRET } = require('../config/env');
const { STATUS_CODES, MESSAGES, DEFAULTS } = require('../constants/api');

class AuthController {
  /**
   * User login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ 
          error: MESSAGES.ERROR.VALIDATION_FAILED, 
          details: errors.array() 
        });
      }

      const { email, password } = req.body;

      // Find user by email (PostgreSQL method)
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ 
          error: MESSAGES.ERROR.INVALID_CREDENTIALS 
        });
      }

      // Check password (PostgreSQL method)
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ 
          error: MESSAGES.ERROR.INVALID_CREDENTIALS 
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role,
          email: user.email 
        },
        JWT_SECRET,
        { expiresIn: DEFAULTS.JWT.EXPIRES_IN }
      );

      logger.info(`User logged in: ${user.email}`);

      res.status(STATUS_CODES.OK).json({ 
        token,
        user: {
          id: user.id,
          name: user.name,
          display_name: user.display_name,
          email: user.email,
          role: user.role,
          profile_picture: user.profile_picture
        }
      });
    } catch (error) {
      logger.error('Login error occurred:', error);
      next(error);
    }
  }

  /**
   * User logout (token invalidation would require Redis or similar)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    // In a real application, you might want to blacklist the token
    res.status(200).json({ message: 'Logged out successfully' });
  }

  /**
   * Refresh token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async refreshToken(req, res, next) {
    try {
      const { userId } = req.user;
      
      // Use PostgreSQL method
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const newToken = jwt.sign(
        { 
          userId: user.id, 
          role: user.role,
          email: user.email 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Return both token and user data for frontend context
      res.status(200).json({ 
        token: newToken,
        user: {
          id: user.id,
          name: user.name,
          display_name: user.display_name,
          email: user.email,
          role: user.role,
          profile_picture: user.profile_picture
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate existing token and return user data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async validateToken(req, res, next) {
    try {
      const { userId } = req.user;
      
      // Use PostgreSQL method
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ 
        user: {
          id: user.id,
          name: user.name,
          display_name: user.display_name,
          email: user.email,
          role: user.role,
          profile_picture: user.profile_picture
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();