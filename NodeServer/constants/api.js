// API-related constants
module.exports = {
  // HTTP Status Codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },

  // API Response Messages
  MESSAGES: {
    SUCCESS: {
      NUTRITION_CALCULATED: 'Nutrition calculated successfully',
      NUTRITION_LOGGED: 'Nutrition logged successfully',
      RECOMMENDATIONS_GENERATED: 'Recommendations generated successfully',
      TRENDS_ANALYZED: 'Trends analyzed successfully',
      FOOD_CATEGORIES_RETRIEVED: 'Food categories retrieved successfully',
      MENU_SAVED: 'Menu saved successfully',
      MENU_DELETED: 'Menu deleted successfully',
      ITEM_DELETED: 'Item deleted successfully',
      SAVED_MENUS_RETRIEVED: 'Saved menus retrieved successfully'
    },
    ERROR: {
      VALIDATION_FAILED: 'Validation failed',
      USER_NOT_FOUND: 'User not found',
      LOG_NOT_FOUND: 'Nutrition log not found for this date',
      MENU_NOT_FOUND: 'Menu not found or not owned by user',
      PYTHON_SERVER_UNAVAILABLE: 'Python service unavailable',
      RECOMMENDATION_SERVICE_UNAVAILABLE: 'Recommendation service temporarily unavailable',
      FOOD_CATEGORY_SERVICE_UNAVAILABLE: 'Food category service temporarily unavailable'
    }
  },

  // Default values
  DEFAULTS: {
    JWT: {
      EXPIRES_IN: '24h'
    }
  }
};