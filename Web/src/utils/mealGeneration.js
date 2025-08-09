// Meal generation utility functions
import { MEAL_GENERATION_DEFAULTS } from '../constants/meals';

/**
 * Calculate nutrition parameters based on calories and meal type
 * @param {number} calories - Target calories
 * @param {string} mealType - Type of meal
 * @returns {Object} Calculated nutrition parameters
 */
export const calculateNutritionFromCalories = (calories, mealType) => {
  const defaults = MEAL_GENERATION_DEFAULTS[mealType] || MEAL_GENERATION_DEFAULTS.breakfast;
  
  return {
    calories: calories,
    protein: Math.round(calories * (defaults.protein / 100) / 4), // 4 kcal per gram protein
    carbs: Math.round(calories * (defaults.carbs / 100) / 4),     // 4 kcal per gram carbs
    fat: Math.round(calories * (defaults.fat / 100) / 9)         // 9 kcal per gram fat
  };
};

/**
 * Get default generation parameters for a meal type
 * @param {string} mealType - Type of meal
 * @returns {Object} Default parameters
 */
export const getDefaultGenerationParams = (mealType) => {
  const defaults = MEAL_GENERATION_DEFAULTS[mealType] || MEAL_GENERATION_DEFAULTS.breakfast;
  return calculateNutritionFromCalories(defaults.defaultCalories, mealType);
};

/**
 * Validate generation parameters
 * @param {Object} params - Generation parameters
 * @returns {Object} Validation result
 */
export const validateGenerationParams = (params) => {
  const errors = {};
  let isValid = true;

  if (!params.calories || params.calories < 50) {
    errors.calories = 'Calories must be at least 50';
    isValid = false;
  }

  if (params.calories > 2000) {
    errors.calories = 'Calories seem too high for a single meal';
    isValid = false;
  }

  if (!params.protein || params.protein < 1) {
    errors.protein = 'Protein must be at least 1g';
    isValid = false;
  }

  if (!params.carbs || params.carbs < 1) {
    errors.carbs = 'Carbs must be at least 1g';
    isValid = false;
  }

  if (!params.fat || params.fat < 1) {
    errors.fat = 'Fat must be at least 1g';
    isValid = false;
  }

  if (!params.num_items || params.num_items < 1 || params.num_items > 10) {
    errors.num_items = 'Number of items must be between 1 and 10';
    isValid = false;
  }

  return { isValid, errors };
};

/**
 * Format menu for display
 * @param {Object} menu - Menu object
 * @returns {Object} Formatted menu
 */
export const formatMenuForDisplay = (menu) => {
  if (!menu) return null;

  return {
    ...menu,
    totalNutrition: menu.total_nutrition || calculateTotalNutritionFromItems(menu.items),
    formattedItems: menu.items?.map(item => ({
      ...item,
      displayName: item.name || item.custom_food_name,
      displayQuantity: `${item.quantity || item.planned_quantity || 100}g`
    })) || []
  };
};

/**
 * Calculate total nutrition from menu items
 * @param {Array} items - Menu items
 * @returns {Object} Total nutrition
 */
const calculateTotalNutritionFromItems = (items) => {
  if (!items || items.length === 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  return items.reduce((total, item) => {
    const quantity = item.quantity || item.planned_quantity || 100;
    const multiplier = quantity / 100;

    return {
      calories: total.calories + ((item.calories || item.calories_per_100g || 0) * multiplier),
      protein: total.protein + ((item.protein || item.protein_per_100g || 0) * multiplier),
      carbs: total.carbs + ((item.carbs || item.carbs_per_100g || 0) * multiplier),
      fat: total.fat + ((item.fat || item.fat_per_100g || 0) * multiplier)
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
};