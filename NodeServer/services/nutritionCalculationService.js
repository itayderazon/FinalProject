// Nutrition calculation business logic service
const PythonService = require('./pythonService');
const NutritionUtils = require('../utils/nutritionUtils');
const { MESSAGES } = require('../constants/api');
const logger = require('../utils/logger');

class NutritionCalculationService {
  /**
   * Calculate nutrition based on user input
   * @param {Object} requestData - Request data from controller
   * @param {string|null} userId - User ID (can be null if auth disabled)
   * @returns {Object} Calculation result from Python service
   */
  async calculateNutrition(requestData, userId = null) {
    try {
      // Format data for Python service
      const nutritionData = NutritionUtils.formatNutritionDataForPython(requestData);
      
      logger.info('Sending nutrition calculation to Python service:', nutritionData);
      
      // Send to Python server
      const calculationResult = await PythonService.calculateNutrition(nutritionData);
      
      logger.info(`Nutrition calculation successful${userId ? ` for user: ${userId}` : ''}`);
      
      return {
        message: MESSAGES.SUCCESS.NUTRITION_CALCULATED,
        data: calculationResult
      };
    } catch (error) {
      logger.error('Error in nutrition calculation service:', error);
      throw error;
    }
  }

  /**
   * Get food categories from Python service
   * @returns {Object} Food categories data
   */
  async getFoodCategories() {
    try {
      const categories = await PythonService.getFoodCategories();
      
      logger.info('Food categories retrieved successfully');
      
      return {
        message: MESSAGES.SUCCESS.FOOD_CATEGORIES_RETRIEVED,
        ...categories
      };
    } catch (error) {
      logger.error('Error retrieving food categories:', error);
      throw error;
    }
  }
}

module.exports = new NutritionCalculationService();