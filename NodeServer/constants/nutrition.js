// Nutrition-related constants
module.exports = {
  // Time constants for calculations
  TIME_CONSTANTS: {
    MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
    DAYS_PER_WEEK: 7,
    DEFAULT_HISTORY_DAYS: 30,
    DEFAULT_TRENDS_DAYS: 30,
    RECENT_LOGS_DAYS: 7
  },

  // Default nutrition values
  DEFAULTS: {
    QUANTITY: 100,
    UNIT: 'grams',
    HISTORY_LIMIT: 30,
    LOGS_LIMIT: 100
  },

  // Macro nutrients
  MACRONUTRIENTS: {
    CALORIES: 'calories',
    PROTEIN: 'protein',
    CARBS: 'carbs',
    FAT: 'fat'
  },

  // Meal types
  MEAL_TYPES: {
    BREAKFAST: 'breakfast',
    LUNCH: 'lunch',
    DINNER: 'dinner',
    SNACK: 'snack'
  },

  // Units
  UNITS: {
    GRAMS: 'grams',
    ML: 'ml',
    CUPS: 'cups',
    PIECES: 'pieces'
  },

  // Validation limits
  VALIDATION_LIMITS: {
    MIN_CALORIES: 0,
    MAX_CALORIES: 10000,
    MIN_PROTEIN: 0,
    MAX_PROTEIN: 1000,
    MIN_CARBS: 0,
    MAX_CARBS: 1000,
    MIN_FAT: 0,
    MAX_FAT: 1000,
    MIN_QUANTITY: 0.1,
    MAX_QUANTITY: 10000
  }
};