const express = require('express');
const { body, query, param } = require('express-validator');
const dailyMenuController = require('../controllers/dailyMenuController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules
const createDailyMenuValidation = [
  body('menu_date').isISO8601().withMessage('Menu date must be a valid date'),
  body('name').isLength({ min: 1, max: 255 }).withMessage('Name is required and must be less than 255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('is_template').optional().isBoolean().withMessage('is_template must be a boolean')
];

const updateDailyMenuValidation = [
  body('menu_date').optional().isISO8601().withMessage('Menu date must be a valid date'),
  body('name').optional().isLength({ min: 1, max: 255 }).withMessage('Name must be less than 255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('is_template').optional().isBoolean().withMessage('is_template must be a boolean')
];

const addMealValidation = [
  body('meal_type').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('meal_order').optional().isInt({ min: 1, max: 10 }).withMessage('Meal order must be between 1 and 10'),
  body('name').optional().isLength({ max: 255 }).withMessage('Name must be less than 255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('target_nutrition').optional().isObject().withMessage('target_nutrition must be an object'),
  body('target_nutrition.calories').optional().isNumeric().withMessage('Calories must be a number'),
  body('target_nutrition.protein').optional().isNumeric().withMessage('Protein must be a number'),
  body('target_nutrition.carbs').optional().isNumeric().withMessage('Carbs must be a number'),
  body('target_nutrition.fat').optional().isNumeric().withMessage('Fat must be a number'),
  body('items').optional().isArray().withMessage('Items must be an array')
];

const addGeneratedMenuValidation = [
  body('meal_type').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('meal_order').optional().isInt({ min: 1, max: 10 }).withMessage('Meal order must be between 1 and 10'),
  body('generated_menu').isObject().withMessage('Generated menu is required'),
  body('generated_menu.items').isArray().withMessage('Generated menu must have items array')
];

const copyMenuValidation = [
  body('new_date').optional().isISO8601().withMessage('New date must be a valid date'),
  body('new_name').optional().isLength({ min: 1, max: 255 }).withMessage('New name must be less than 255 characters'),
  body('as_template').optional().isBoolean().withMessage('as_template must be a boolean')
];

const dateRangeValidation = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be 0 or greater')
];

const menuIdValidation = [
  param('menuId').isInt({ min: 1 }).withMessage('Menu ID must be a positive integer')
];

const mealIdValidation = [
  param('mealId').isInt({ min: 1 }).withMessage('Meal ID must be a positive integer')
];

const dateParamValidation = [
  param('date').isISO8601().withMessage('Date must be a valid date')
];

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// Routes for daily menus
router.post('/', createDailyMenuValidation, dailyMenuController.createDailyMenu);
router.get('/', dateRangeValidation, dailyMenuController.getUserDailyMenus);
router.get('/templates', dateRangeValidation, dailyMenuController.getUserMenuTemplates);
router.get('/nutrition-summary', dateRangeValidation, dailyMenuController.getNutritionSummary);

// Routes for specific daily menu by ID
router.get('/:menuId', menuIdValidation, dailyMenuController.getDailyMenuById);
router.put('/:menuId', menuIdValidation.concat(updateDailyMenuValidation), dailyMenuController.updateDailyMenu);
router.delete('/:menuId', menuIdValidation, dailyMenuController.deleteDailyMenu);
router.post('/:menuId/copy', menuIdValidation.concat(copyMenuValidation), dailyMenuController.copyDailyMenu);

// Routes for daily menu by date
router.get('/date/:date', dateParamValidation, dailyMenuController.getDailyMenuByDate);

// Routes for meals within daily menus
router.post('/:menuId/meals', menuIdValidation.concat(addMealValidation), dailyMenuController.addMealToDailyMenu);
router.post('/:menuId/meals/generated', menuIdValidation.concat(addGeneratedMenuValidation), dailyMenuController.addGeneratedMenuToDaily);
router.delete('/:menuId/meals/:mealId', menuIdValidation.concat(mealIdValidation), dailyMenuController.removeMealFromDailyMenu);

module.exports = router; 