/**
 * API Constants for React Frontend
 * Centralized constants for API endpoints, configuration, and UI constants
 */

// API Base URLs
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const PYTHON_API_BASE_URL = import.meta.env.VITE_PYTHON_API_BASE_URL || 'http://localhost:8000';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    REFRESH_TOKEN: `${API_BASE_URL}/api/auth/refresh-token`,
    VALIDATE_TOKEN: `${API_BASE_URL}/api/auth/validate-token`
  },
  
  // Users
  USERS: {
    PROFILE: `${API_BASE_URL}/api/users/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/api/users/profile`,
    NUTRITION_PROFILE: `${API_BASE_URL}/api/users/nutrition-profile`
  },
  
  // Nutrition
  NUTRITION: {
    CALCULATE: `${API_BASE_URL}/api/nutrition/calculate`,
    LOG: `${API_BASE_URL}/api/nutrition/log`,
    HISTORY: `${API_BASE_URL}/api/nutrition/history`,
    RECOMMENDATIONS: `${API_BASE_URL}/api/nutrition/recommendations`,
    TRENDS: `${API_BASE_URL}/api/nutrition/trends`,
    DELETE_ITEM: `${API_BASE_URL}/api/nutrition/log/item`,
    FOOD_CATEGORIES: `${API_BASE_URL}/api/nutrition/food-categories`,
    SAVED_MENUS: `${API_BASE_URL}/api/nutrition/saved-menus`
  },
  
  // Products
  PRODUCTS: {
    BASE: `${API_BASE_URL}/api/products`,
    SEARCH: `${API_BASE_URL}/api/products/search`,
    CATEGORIES: `${API_BASE_URL}/api/products/categories`
  },
  
  // Cart
  CART: {
    BASE: `${API_BASE_URL}/api/cart`,
    ADD_ITEM: `${API_BASE_URL}/api/cart/add`,
    UPDATE_ITEM: `${API_BASE_URL}/api/cart/update`,
    REMOVE_ITEM: `${API_BASE_URL}/api/cart/remove`,
    CLEAR: `${API_BASE_URL}/api/cart/clear`
  },
  
  // Daily Menus
  DAILY_MENUS: {
    BASE: `${API_BASE_URL}/api/daily-menus`,
    GENERATE: `${API_BASE_URL}/api/daily-menus/generate`,
    SAVE: `${API_BASE_URL}/api/daily-menus/save`
  },
  
  // Health Check
  HEALTH: `${API_BASE_URL}/health`,
  STATS: `${API_BASE_URL}/api/stats`
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Request Configuration
export const REQUEST_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  CART_DATA: 'cartData',
  THEME_PREFERENCE: 'themePreference',
  LANGUAGE_PREFERENCE: 'languagePreference'
};

// Default Values
export const DEFAULTS = {
  PAGINATION: {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100
  },
  
  NUTRITION: {
    DAILY_CALORIES: 2000,
    PROTEIN_PERCENTAGE: 20,
    CARBS_PERCENTAGE: 50,
    FAT_PERCENTAGE: 30
  },
  
  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    DEBOUNCE_DELAY: 300
  }
};

export default {
  API_ENDPOINTS,
  HTTP_STATUS,
  REQUEST_CONFIG,
  STORAGE_KEYS,
  DEFAULTS
};