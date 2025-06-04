const jwt = require('jsonwebtoken');
const User = require('../models/UserPostgres');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { JWT_SECRET } = require('../config/env');

class AuthController {
  // User login
  async login(req, res, next) {
    try {
      console.log('🔐 Login attempt started');
      console.log('📝 Request body:', req.body);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { email, password } = req.body;
      console.log('🔍 Looking for user with email:', email);

      // Find user by email (PostgreSQL method)
      const user = await User.findByEmail(email);
      console.log('👤 User found:', user ? 'Yes' : 'No');
      if (!user) {
        console.log('❌ User not found for email:', email);
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      console.log('🔑 Checking password...');
      // Check password (PostgreSQL method)
      const isPasswordValid = await user.comparePassword(password);
      console.log('🔓 Password valid:', isPasswordValid);
      if (!isPasswordValid) {
        console.log('❌ Invalid password for user:', email);
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      console.log('🎫 Generating JWT token...');
      console.log('🔑 JWT_SECRET available:', !!JWT_SECRET);
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role,
          email: user.email 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('✅ Login successful for user:', email);
      logger.info(`User logged in: ${user.email}`);

      res.status(200).json({ 
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
      console.error('💥 Login error occurred:', error);
      console.error('💥 Error stack:', error.stack);
      next(error);
    }
  }

  // User logout (token invalidation would require Redis or similar)
  async logout(req, res) {
    // In a real application, you might want to blacklist the token
    res.status(200).json({ message: 'Logged out successfully' });
  }

  // Refresh token
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

  // Validate existing token and return user data
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