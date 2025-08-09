// Nutrition calculation and formatting utilities
const { DEFAULTS } = require('../constants/nutrition');

class NutritionUtils {
  /**
   * Calculate average of numbers array
   * @param {number[]} numbers - Array of numbers
   * @returns {number} Average rounded to 2 decimal places
   */
  static calculateAverage(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return Math.round((sum / numbers.length) * 100) / 100;
  }

  /**
   * Format nutrition data for Python service
   * @param {Object} requestBody - Request body data
   * @returns {Object} Formatted nutrition data
   */
  static formatNutritionDataForPython(requestBody) {
    const nutritionData = {
      calories: parseFloat(requestBody.calories),
      protein: parseFloat(requestBody.protein),
      carbs: parseFloat(requestBody.carbs),
      fat: parseFloat(requestBody.fat),
      meal_template: requestBody.meal_template || null,
      subcategories: requestBody.subcategories || null,
      num_items: requestBody.num_items ? parseInt(requestBody.num_items) : null,
      include_prices: requestBody.include_prices === true || requestBody.include_prices === 'true',
      requiredProducts: requestBody.requiredProducts || null,
      excluded_allergens: requestBody.excluded_allergens || null
    };

    // Remove null/undefined values
    return this.removeNullValues(nutritionData);
  }

  /**
   * Format meal item for logging
   * @param {Object} food - Food item
   * @returns {Object} Formatted meal item
   */
  static formatMealItem(food) {
    return {
      product_id: food.product_id || null,
      custom_food_name: food.name,
      quantity: parseFloat(food.quantity) || DEFAULTS.QUANTITY,
      unit: food.unit || DEFAULTS.UNIT,
      calories: parseFloat(food.calories) || 0,
      protein: parseFloat(food.macros?.protein || food.protein) || 0,
      carbs: parseFloat(food.macros?.carbs || food.carbs) || 0,
      fat: parseFloat(food.macros?.fat || food.fat) || 0
    };
  }

  /**
   * Calculate daily totals from meal items
   * @param {Object[]} items - Array of meal items
   * @returns {Object} Daily nutrition totals
   */
  static calculateDailyTotals(items) {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

    items.forEach(item => {
      totals.calories += item.calories || 0;
      totals.protein += item.protein || 0;
      totals.carbs += item.carbs || 0;
      totals.fat += item.fat || 0;
    });

    return totals;
  }

  /**
   * Calculate goal progress
   * @param {Object} current - Current nutrition values
   * @param {Object} goals - Goal nutrition values
   * @returns {Object} Goal progress with percentages
   */
  static calculateGoalProgress(current, goals) {
    if (!goals) return null;

    return {
      calories: this.calculateGoalProgressItem(current.total_calories, goals.daily_calories),
      protein: this.calculateGoalProgressItem(current.total_protein, goals.protein_goal),
      carbs: this.calculateGoalProgressItem(current.total_carbs, goals.carbs_goal),
      fat: this.calculateGoalProgressItem(current.total_fat, goals.fat_goal)
    };
  }

  /**
   * Calculate progress for individual goal item
   * @param {number} current - Current value
   * @param {number} goal - Goal value
   * @returns {Object} Progress item with current, goal, and percentage
   */
  static calculateGoalProgressItem(current, goal) {
    return {
      current: current || 0,
      goal: goal || 0,
      percentage: goal ? Math.round((current / goal) * 100 * 100) / 100 : 0
    };
  }

  /**
   * Remove null and undefined values from object
   * @param {Object} obj - Object to clean
   * @returns {Object} Cleaned object
   */
  static removeNullValues(obj) {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== null && obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    });
    return cleaned;
  }

  /**
   * Group nutrition logs by week
   * @param {Object[]} logs - Nutrition logs
   * @returns {Object} Logs grouped by week
   */
  static groupLogsByWeek(logs) {
    const DateUtils = require('./dateUtils');
    const weeklyData = {};

    logs.forEach(log => {
      const week = DateUtils.getWeekKey(log.log_date);
      if (!weeklyData[week]) {
        weeklyData[week] = {
          calories: [],
          protein: [],
          carbs: [],
          fat: []
        };
      }

      weeklyData[week].calories.push(log.total_calories);
      weeklyData[week].protein.push(log.total_protein);
      weeklyData[week].carbs.push(log.total_carbs);
      weeklyData[week].fat.push(log.total_fat);
    });

    return weeklyData;
  }

  /**
   * Calculate weekly trends from grouped data
   * @param {Object} weeklyData - Data grouped by week
   * @returns {Object[]} Array of weekly trend objects
   */
  static calculateWeeklyTrends(weeklyData) {
    const trends = Object.keys(weeklyData).map(week => ({
      week,
      avg_calories: this.calculateAverage(weeklyData[week].calories),
      avg_protein: this.calculateAverage(weeklyData[week].protein),
      avg_carbs: this.calculateAverage(weeklyData[week].carbs),
      avg_fat: this.calculateAverage(weeklyData[week].fat)
    }));

    return trends.sort((a, b) => a.week.localeCompare(b.week));
  }
}

module.exports = NutritionUtils;