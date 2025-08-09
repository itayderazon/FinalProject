const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Import services
const nutritionCalculationService = require('../services/nutritionCalculationService');
const nutritionLoggingService = require('../services/nutritionLoggingService');
const nutritionAnalysisService = require('../services/nutritionAnalysisService');
const nutritionMenuService = require('../services/nutritionMenuService');

// Import constants
const { STATUS_CODES, MESSAGES } = require('../constants/api');

class NutritionController {
  // Calculate nutrition based on user data
  async calculateNutrition(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ 
          error: MESSAGES.ERROR.VALIDATION_FAILED, 
          details: errors.array() 
        });
      }
  
      // Handle case where authentication is disabled
      const userId = req.user?.userId || null;
      
      // Use service to handle calculation
      const result = await nutritionCalculationService.calculateNutrition(req.body, userId);
  
      res.status(STATUS_CODES.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Log daily nutrition
  async logNutrition(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ 
          error: MESSAGES.ERROR.VALIDATION_FAILED, 
          details: errors.array() 
        });
      }

      const userId = req.user.userId;
      const result = await nutritionLoggingService.logNutrition(userId, req.body);

      res.status(STATUS_CODES.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get nutrition history
  async getNutritionHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await nutritionLoggingService.getNutritionHistory(userId, req.query);

      res.status(STATUS_CODES.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Delete a nutrition log item
  async deleteNutritionItem(req, res, next) {
    try {
      const userId = req.user.userId;
      const { itemId } = req.params;
      const { logDate } = req.body;

      const result = await nutritionLoggingService.deleteNutritionItem(userId, itemId, logDate);

      res.status(STATUS_CODES.OK).json(result);
    } catch (error) {
      if (error.status === 404) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // Get nutrition recommendations from Python server
  async getRecommendations(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await nutritionAnalysisService.getRecommendations(userId);

      res.status(STATUS_CODES.OK).json(result);
    } catch (error) {
      if (error.code === 'PYTHON_SERVER_ERROR') {
        return res.status(STATUS_CODES.SERVICE_UNAVAILABLE).json({ 
          error: MESSAGES.ERROR.RECOMMENDATION_SERVICE_UNAVAILABLE 
        });
      }
      if (error.status === 404) {
        return res.status(STATUS_CODES.NOT_FOUND).json({ 
          error: error.message 
        });
      }
      next(error);
    }
  }

  // Analyze nutrition trends
  async analyzeTrends(req, res, next) {
    try {
      const userId = req.user.userId;
      const { period = '30' } = req.query;

      const result = await nutritionAnalysisService.analyzeTrends(userId, period);

      res.status(STATUS_CODES.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get food categories and subcategories from Python server
  async getFoodCategories(req, res, next) {
    try {
      const result = await nutritionCalculationService.getFoodCategories();

      res.status(STATUS_CODES.OK).json(result);
    } catch (error) {
      if (error.code === 'PYTHON_SERVER_ERROR') {
        return res.status(STATUS_CODES.SERVICE_UNAVAILABLE).json({ 
          error: MESSAGES.ERROR.FOOD_CATEGORY_SERVICE_UNAVAILABLE 
        });
      }
      next(error);
    }
  }

  // Get all saved menus for a user
  async getSavedMenus(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await nutritionMenuService.getSavedMenus(userId);

      res.status(STATUS_CODES.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Save a new menu
  async saveMenu(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ 
          error: MESSAGES.ERROR.VALIDATION_FAILED, 
          details: errors.array() 
        });
      }

      const userId = req.user.userId;
      const result = await nutritionMenuService.saveMenu(userId, req.body);

      res.status(STATUS_CODES.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Delete a saved menu
  async deleteSavedMenu(req, res, next) {
    try {
      const userId = req.user.userId;
      const menuId = req.params.id;

      const result = await nutritionMenuService.deleteSavedMenu(userId, menuId);

      res.status(STATUS_CODES.OK).json(result);
    } catch (error) {
      if (error.status === 404) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }
}

module.exports = new NutritionController();