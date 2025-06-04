const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/UserPostgres');
const NutritionLog = require('../models/NutritionLogPostgres');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('display_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters long and contain both letters and numbers')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('display_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters')
];

const nutritionProfileValidation = [
  body('height')
    .optional()
    .isNumeric()
    .isFloat({ min: 100, max: 250 })
    .withMessage('Height must be between 100 and 250 cm'),
  body('weight')
    .optional()
    .isNumeric()
    .isFloat({ min: 30, max: 300 })
    .withMessage('Weight must be between 30 and 300 kg'),
  body('age')
    .optional()
    .isInt({ min: 13, max: 120 })
    .withMessage('Age must be between 13 and 120 years'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('activity_level')
    .optional()
    .isIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'])
    .withMessage('Invalid activity level'),
  body('dietary_goal')
    .optional()
    .isIn(['maintain', 'lose', 'gain'])
    .withMessage('Dietary goal must be maintain, lose, or gain')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Register new user
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, display_name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      display_name,
      email,
      password,
      role
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
});

// Get user by ID
router.get('/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is accessing their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

// Update user profile
router.put('/:id/profile', 
  authMiddleware.authenticate, 
  updateProfileValidation, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is updating their own profile
      if (req.user.id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const updatedUser = await user.updateProfile(req.body);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser.toJSON()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }
);

// Update nutrition profile
router.put('/:id/nutrition-profile', 
  authMiddleware.authenticate, 
  nutritionProfileValidation, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is updating their own profile
      if (req.user.id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const nutritionProfile = await user.updateNutritionProfile(req.body);
      
      res.json({
        success: true,
        message: 'Nutrition profile updated successfully',
        nutrition_profile: nutritionProfile
      });
    } catch (error) {
      console.error('Error updating nutrition profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update nutrition profile'
      });
    }
  }
);

// Update password
router.put('/:id/password', authMiddleware.authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { current_password, new_password } = req.body;

    // Check if user is updating their own password
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(current_password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    await user.updatePassword(new_password);
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update password'
    });
  }
});

// Get user's nutrition logs
router.get('/:id/nutrition-logs', authMiddleware.authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is accessing their own data
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const { start_date, end_date, limit = 30, offset = 0 } = req.query;
    
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    const logs = await NutritionLog.getUserLogs(userId, startDate, endDate, parseInt(limit), parseInt(offset));
    const summary = await NutritionLog.getSummary(userId, startDate, endDate);

    res.json({
      success: true,
      logs: logs.map(log => log.toJSON()),
      summary,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: logs.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting nutrition logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get nutrition logs'
    });
  }
});

// Deactivate user account
router.delete('/:id', authMiddleware.authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is deleting their own account or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.deactivate();
    
    res.json({
      success: true,
      message: 'User account deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate user'
    });
  }
});

// Admin routes

// Get all users (admin only)
router.get('/', authMiddleware.authenticate, authMiddleware.requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const users = await User.getAll(parseInt(limit), parseInt(offset));
    const totalCount = await User.count();

    res.json({
      success: true,
      users: users.map(user => user.toJSON()),
      count: users.length,
      total: totalCount,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + users.length) < totalCount
      }
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
});

module.exports = router; 