const express = require('express');
const { body, query } = require('express-validator');
const nutritionController = require('../controllers/nutritionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const calculateNutritionValidation = [
  body('calories').isNumeric().withMessage('Calories must be a number'),
  body('protein').isNumeric().withMessage('Protein must be a number'), 
  body('carbs').isNumeric().withMessage('Carbs must be a number'),
  body('fat').isNumeric().withMessage('Fat must be a number'),
  body('foods').optional().isArray().withMessage('Foods must be an array'), // ✅ Make optional
  body('meal_type').optional().isString(),
  body('num_items').optional().isNumeric()
];

const logNutritionValidation = [
  body('meals').isArray().withMessage('Meals must be an array'),
  body('meals.*.type').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('meals.*.foods').isArray().withMessage('Foods must be an array'),
  body('waterIntake').optional().isNumeric().withMessage('Water intake must be a number')
];

const historyValidation = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// Routes
router.post('/calculate', calculateNutritionValidation, nutritionController.calculateNutrition);
router.post('/log', logNutritionValidation, nutritionController.logNutrition);
router.get('/history', historyValidation, nutritionController.getNutritionHistory);
router.get('/recommendations', nutritionController.getRecommendations);
router.get('/trends', nutritionController.analyzeTrends);

module.exports = router;