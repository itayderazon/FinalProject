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
  body('meal_template').optional().isString(),
  body('subcategories').optional().isArray().withMessage('Subcategories must be an array'),
  body('num_items').optional().isNumeric(),
  body('requiredProducts').optional().isArray().withMessage('Required products must be an array'),
  body('excluded_allergens').optional().isArray().withMessage('Excluded allergens must be an array')
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

const saveMenuValidation = [
  body('name').isString().notEmpty().withMessage('Menu name is required'),
  body('description').optional().isString(),
  body('total_nutrition').isObject().withMessage('Total nutrition must be an object'),
  body('items').isArray().withMessage('Items must be an array'),
  body('generation_parameters').optional().isObject()
];

// Apply authentication middleware to all routes - TEMPORARILY DISABLED FOR TESTING
// router.use(authMiddleware.authenticate);

// Routes
router.post('/calculate', calculateNutritionValidation, nutritionController.calculateNutrition);
router.post('/log', logNutritionValidation, authMiddleware.authenticate, nutritionController.logNutrition);
router.get('/history', historyValidation, authMiddleware.authenticate, nutritionController.getNutritionHistory);
router.delete('/items/:itemId', authMiddleware.authenticate, nutritionController.deleteNutritionItem);
router.get('/recommendations', authMiddleware.authenticate, nutritionController.getRecommendations);
router.get('/trends', authMiddleware.authenticate, nutritionController.analyzeTrends);
router.get('/food-categories', nutritionController.getFoodCategories);

// Saved menu routes
router.get('/saved-menus', authMiddleware.authenticate, nutritionController.getSavedMenus);
router.post('/saved-menus', saveMenuValidation, authMiddleware.authenticate, nutritionController.saveMenu);
router.delete('/saved-menus/:id', authMiddleware.authenticate, nutritionController.deleteSavedMenu);

module.exports = router;