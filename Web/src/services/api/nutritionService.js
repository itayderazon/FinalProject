/**
 * Nutrition Service
 * Handles all nutrition-related API calls
 */

import apiClient, { handleApiResponse, handleApiError } from './apiClient';
import { API_ENDPOINTS } from '../../constants/api';

class NutritionService {
  /**
   * Calculate nutrition for meal planning
   * @param {Object} nutritionData - Nutrition calculation parameters
   * @returns {Promise<Object>} Calculation results
   */
  async calculateNutrition(nutritionData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.NUTRITION.CALCULATE, nutritionData);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  /**
   * Log daily nutrition
   * @param {Object} logData - Nutrition log data
   * @returns {Promise<Object>} Log response
   */
  async logNutrition(logData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.NUTRITION.LOG, logData);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  /**
   * Get nutrition history
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Nutrition history
   */
  async getNutritionHistory(params = {}) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NUTRITION.HISTORY, {
        params,
      });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  /**
   * Get nutrition recommendations
   * @returns {Promise<Object>} Recommendations
   */
  async getRecommendations() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NUTRITION.RECOMMENDATIONS);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  /**
   * Analyze nutrition trends
   * @param {Object} params - Analysis parameters
   * @returns {Promise<Object>} Trends analysis
   */
  async analyzeTrends(params = {}) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NUTRITION.TRENDS, {
        params,
      });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  /**
   * Delete nutrition log item
   * @param {string} itemId - Item ID to delete
   * @param {Object} logData - Log data containing date
   * @returns {Promise<Object>} Delete response
   */
  async deleteNutritionItem(itemId, logData) {
    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.NUTRITION.DELETE_ITEM}/${itemId}`, {
        data: logData,
      });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  /**
   * Get food categories
   * @returns {Promise<Object>} Food categories
   */
  async getFoodCategories() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NUTRITION.FOOD_CATEGORIES);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  /**
   * Get saved menus
   * @returns {Promise<Object>} Saved menus
   */
  async getSavedMenus() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NUTRITION.SAVED_MENUS);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  /**
   * Save a new menu
   * @param {Object} menuData - Menu data to save
   * @returns {Promise<Object>} Save response
   */
  async saveMenu(menuData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.NUTRITION.SAVED_MENUS, menuData);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  /**
   * Delete a saved menu
   * @param {string} menuId - Menu ID to delete
   * @returns {Promise<Object>} Delete response
   */
  async deleteSavedMenu(menuId) {
    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.NUTRITION.SAVED_MENUS}/${menuId}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  /**
   * Get a specific saved menu
   * @param {string} menuId - Menu ID to retrieve
   * @returns {Promise<Object>} Menu data
   */
  async getSavedMenu(menuId) {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.NUTRITION.SAVED_MENUS}/${menuId}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  /**
   * Update a saved menu
   * @param {string} menuId - Menu ID to update
   * @param {Object} menuData - Updated menu data
   * @returns {Promise<Object>} Update response
   */
  async updateSavedMenu(menuId, menuData) {
    try {
      const response = await apiClient.put(`${API_ENDPOINTS.NUTRITION.SAVED_MENUS}/${menuId}`, menuData);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }
}

// Export singleton instance
export default new NutritionService();