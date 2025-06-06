const express = require('express');
const { body } = require('express-validator');
const PythonService = require('../services/pythonService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Validation rules for price comparison
const priceComparisonValidation = [
  body('menu_items').isArray().withMessage('Menu items must be an array'),
  body('menu_items.*.item_code').isString().withMessage('Item code must be a string'),
  body('menu_items.*.portion_grams').isNumeric().withMessage('Portion grams must be a number'),
  body('menu_items.*.name').isString().withMessage('Item name must be a string')
];

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// Compare prices for menu items
router.post('/compare', priceComparisonValidation, async (req, res, next) => {
  try {
    const { menu_items } = req.body;
    
    // Forward to Python server
    const priceData = await PythonService.comparePrices(menu_items);
    
    res.status(200).json({
      message: 'Price comparison completed',
      data: priceData
    });
  } catch (error) {
    next(error);
  }
});

// Get cheapest combination for menu items
router.post('/cheapest-combination', priceComparisonValidation, async (req, res, next) => {
  try {
    const { menu_items } = req.body;
    
    // Forward to Python server
    const cheapestData = await PythonService.getCheapestCombination(menu_items);
    
    res.status(200).json({
      message: 'Cheapest combination calculated',
      data: cheapestData
    });
  } catch (error) {
    next(error);
  }
});

// Get available supermarkets
router.get('/supermarkets', async (req, res, next) => {
  try {
    // Forward to Python server
    const supermarketsData = await PythonService.getSupermarkets();
    
    res.status(200).json({
      message: 'Supermarkets fetched successfully',
      data: supermarketsData
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 