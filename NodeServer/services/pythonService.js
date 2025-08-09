const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/env');

class PythonService {
  constructor() {
    this.baseURL = config.PYTHON_SERVER_URL;
    this.timeout = config.PYTHON_TIMEOUT;
    this.retries = config.PYTHON_RETRIES;
  }

  async makeRequest(endpoint, data, method = 'POST') {
    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    let lastError;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        logger.info(`Python request attempt ${attempt}: ${method} ${endpoint}`);
        logger.debug(`Making request to: ${config.url}`);
        if (config.data) {
          logger.debug('Request data:', JSON.stringify(config.data, null, 2));
        }
        const response = await axios(config);
        
        logger.info(`Python request successful: ${endpoint}`);
        return response.data;
      } catch (error) {
        lastError = error;
        logger.warn(`Python request attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < this.retries && this.isRetryableError(error)) {
          await this.delay(1000 * attempt); // Progressive backoff
          continue;
        }
        break;
      }
    }

    // If all retries failed
    logger.error(`Python service error after ${this.retries} attempts: ${lastError.message}`);
    
    const error = new Error('Python service unavailable');
    error.code = 'PYTHON_SERVER_ERROR';
    error.originalError = lastError;
    throw error;
  }

  isRetryableError(error) {
    if (!error.response) return true; // Network errors
    const status = error.response.status;
    return status >= 500 || status === 429; // Server errors or rate limiting
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Calculate nutrition based on user input
  async calculateNutrition(nutritionData) {
    return await this.makeRequest('/api/nutrition/calculate', nutritionData);
  }

  // Get food categories and subcategories
  async getFoodCategories() {
    return await this.makeRequest('/api/nutrition/food-categories', null, 'GET');
  }

  // Get personalized recommendations
  async getRecommendations(recommendationData) {
    return await this.makeRequest('/api/nutrition/recommendations', recommendationData);
  }

  // Analyze nutrition trends
  async analyzeTrends(analysisData) {
    return await this.makeRequest('/api/nutrition/trends', analysisData);
  }

  // Calculate BMR and TDEE
  async calculateMetabolism(userProfile) {
    return await this.makeRequest('/api/nutrition/metabolism', userProfile);
  }

  // Generate meal plans
  async generateMealPlan(mealPlanData) {
    return await this.makeRequest('/api/nutrition/meal-plan', mealPlanData);
  }

  // Analyze food composition
  async analyzeFood(foodData) {
    return await this.makeRequest('/api/nutrition/analyze-food', foodData);
  }

  // Price comparison methods
  async comparePrices(menuItems) {
    logger.info('PythonService comparePrices called with menu items count:', menuItems?.length);
    const requestData = { menu_items: menuItems };
    const response = await this.makeRequest('/api/price/compare', requestData);
    logger.info('Python server price comparison completed successfully');
    return response;
  }

  async getCheapestCombination(menuItems) {
    return await this.makeRequest('/api/price/cheapest-combination', { menu_items: menuItems });
  }

  async getSupermarkets() {
    return await this.makeRequest('/api/price/supermarkets', null, 'GET');
  }

  // Health check for Python service
  async healthCheck() {
    try {
      await this.makeRequest('/health', null, 'GET');
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new PythonService();