// Nutrition calculation utilities

/**
 * Calculate total nutrition from an array of meal items
 * @param {Array} items - Array of meal items with nutrition info
 * @returns {Object} Total nutrition values
 */
export const calculateTotalNutrition = (items) => {
  return items.reduce((total, item) => {
    const multiplier = (item.quantity || 0) / 100; // Assuming base values are per 100g
    
    return {
      calories: total.calories + ((item.calories || 0) * multiplier),
      protein: total.protein + ((item.protein || 0) * multiplier),
      carbs: total.carbs + ((item.carbs || 0) * multiplier),
      fat: total.fat + ((item.fat || 0) * multiplier)
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
};

/**
 * Format nutrition value for display
 * @param {number} value - Nutrition value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {number} Formatted value
 */
export const formatNutritionValue = (value, decimals = 1) => {
  return Math.round((value || 0) * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Validate nutrition values
 * @param {Object} nutrition - Nutrition object to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateNutrition = (nutrition) => {
  const errors = {};
  let isValid = true;

  // Check for negative values
  Object.keys(nutrition).forEach(key => {
    if (nutrition[key] < 0) {
      errors[key] = 'Value cannot be negative';
      isValid = false;
    }
  });

  // Check for reasonable limits
  if (nutrition.calories > 10000) {
    errors.calories = 'Calories seem too high';
    isValid = false;
  }
  
  if (nutrition.protein > 1000) {
    errors.protein = 'Protein seems too high';
    isValid = false;
  }

  return { isValid, errors };
};

/**
 * Calculate nutrition per serving
 * @param {Object} nutrition - Total nutrition values
 * @param {number} servings - Number of servings
 * @returns {Object} Nutrition per serving
 */
export const calculatePerServing = (nutrition, servings) => {
  if (!servings || servings <= 0) return nutrition;
  
  return {
    calories: nutrition.calories / servings,
    protein: nutrition.protein / servings,
    carbs: nutrition.carbs / servings,
    fat: nutrition.fat / servings
  };
};