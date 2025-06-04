const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Login validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];

// Routes
router.post('/login', loginValidation, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authMiddleware.authenticate, authController.refreshToken);
router.get('/validate', authMiddleware.authenticate, authController.validateToken);

module.exports = router;