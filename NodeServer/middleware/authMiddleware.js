const jwt = require('jsonwebtoken');
const User = require('../models/UserPostgres');
const logger = require('../utils/logger');
const { JWT_SECRET } = require('../config/env');

class AuthMiddleware {
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if user still exists (PostgreSQL method)
        const user = await User.findById(decoded.userId);
        if (!user || !user.is_active) {
          return res.status(401).json({ error: 'User not found or inactive' });
        }

        // Add user info to request
        req.user = {
          userId: decoded.userId,
          id: decoded.userId,
          role: decoded.role,
          email: decoded.email
        };

        next();
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired' });
        } else if (jwtError.name === 'JsonWebTokenError') {
          return res.status(401).json({ error: 'Invalid token' });
        }
        throw jwtError;
      }
    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  // Admin-only middleware
  requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  }

  // Optional authentication (for public endpoints with enhanced features for authenticated users)
  optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    this.authenticate(req, res, next);
  }
}

module.exports = new AuthMiddleware();