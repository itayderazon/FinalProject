// Nutrition logging business logic service
const NutritionLog = require('../models/NutritionLogPostgres');
const NutritionUtils = require('../utils/nutritionUtils');
const DateUtils = require('../utils/dateUtils');
const { MESSAGES } = require('../constants/api');
const logger = require('../utils/logger');

class NutritionLoggingService {
  /**
   * Log daily nutrition
   * @param {string} userId - User ID
   * @param {Object} logData - Nutrition log data
   * @returns {Object} Log result
   */
  async logNutrition(userId, logData) {
    try {
      const { date, meals, waterIntake } = logData;
      const logDate = date ? DateUtils.formatDateString(date) : DateUtils.getCurrentDateString();

      // Check if log already exists for this date
      let nutritionLog = await NutritionLog.findByUserAndDate(userId, logDate);

      if (!nutritionLog) {
        // Create new log
        nutritionLog = await NutritionLog.create(userId, logDate);
      }

      // Calculate daily totals
      let dailyTotals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };

      // Add meals to the log
      for (const meal of meals) {
        const items = meal.foods.map(food => NutritionUtils.formatMealItem(food));
        await nutritionLog.addMeal(meal.type, items);

        // Update daily totals
        const mealTotals = NutritionUtils.calculateDailyTotals(items);
        dailyTotals.calories += mealTotals.calories;
        dailyTotals.protein += mealTotals.protein;
        dailyTotals.carbs += mealTotals.carbs;
        dailyTotals.fat += mealTotals.fat;
      }

      // Update water intake if provided
      if (waterIntake !== undefined) {
        await nutritionLog.updateWaterIntake(waterIntake);
      }

      logger.info(`Nutrition logged for user: ${userId}, date: ${logDate}`);

      return {
        message: MESSAGES.SUCCESS.NUTRITION_LOGGED,
        log: nutritionLog.toJSON()
      };
    } catch (error) {
      logger.error('Error in nutrition logging service:', error);
      throw error;
    }
  }

  /**
   * Get nutrition history for user
   * @param {string} userId - User ID
   * @param {Object} queryParams - Query parameters
   * @returns {Object} Nutrition history
   */
  async getNutritionHistory(userId, queryParams) {
    try {
      const { startDate, endDate, limit = 30, includeMeals = 'false' } = queryParams;

      // Set default date range if not provided
      const endDateFormatted = endDate || DateUtils.getCurrentDateString();
      const startDateFormatted = startDate || DateUtils.getDateDaysAgo(30);

      // Get logs using PostgreSQL method
      const nutritionLogs = await NutritionLog.getUserLogs(
        userId,
        startDateFormatted,
        endDateFormatted,
        parseInt(limit)
      );

      // Include meals if requested
      const logsWithData = await Promise.all(nutritionLogs.map(async (log) => {
        const logData = log.toJSON();

        if (includeMeals === 'true') {
          const meals = await log.getMeals();
          logData.meals = meals;
        }

        return logData;
      }));

      return {
        logs: logsWithData,
        count: nutritionLogs.length
      };
    } catch (error) {
      logger.error('Error in nutrition history service:', error);
      throw error;
    }
  }

  /**
   * Delete nutrition item
   * @param {string} userId - User ID
   * @param {string} itemId - Item ID to delete
   * @param {string} logDate - Log date
   * @returns {Object} Updated log
   */
  async deleteNutritionItem(userId, itemId, logDate) {
    try {
      // Find the nutrition log for the date
      const nutritionLog = await NutritionLog.findByUserAndDate(userId, logDate);

      if (!nutritionLog) {
        const error = new Error(MESSAGES.ERROR.LOG_NOT_FOUND);
        error.status = 404;
        throw error;
      }

      // Remove the item
      await nutritionLog.removeItem(parseInt(itemId));

      // Get updated log with meals
      const meals = await nutritionLog.getMeals();
      const updatedLog = {
        ...nutritionLog.toJSON(),
        meals: meals
      };

      logger.info(`Item deleted for user: ${userId}, item: ${itemId}`);

      return {
        success: true,
        message: MESSAGES.SUCCESS.ITEM_DELETED,
        log: updatedLog
      };
    } catch (error) {
      logger.error('Error deleting nutrition item:', error);
      throw error;
    }
  }
}

module.exports = new NutritionLoggingService();