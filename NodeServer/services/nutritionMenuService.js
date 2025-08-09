// Nutrition menu management service
const SavedMenu = require('../models/SavedMenuPostgres');
const { MESSAGES } = require('../constants/api');
const logger = require('../utils/logger');

class NutritionMenuService {
  /**
   * Get all saved menus for a user
   * @param {string} userId - User ID
   * @returns {Object} Saved menus
   */
  async getSavedMenus(userId) {
    try {
      // Get saved menus using the model
      const savedMenusData = await SavedMenu.getUserMenus(userId);
      
      // Format the response to match the frontend expectations
      const savedMenus = savedMenusData.map(menu => menu.toJSON());

      logger.info(`Retrieved ${savedMenus.length} saved menus for user: ${userId}`);

      return {
        success: true,
        message: MESSAGES.SUCCESS.SAVED_MENUS_RETRIEVED,
        savedMenus,
        count: savedMenus.length
      };
    } catch (error) {
      logger.error('Error getting saved menus:', error);
      throw error;
    }
  }

  /**
   * Save a new menu
   * @param {string} userId - User ID
   * @param {Object} menuData - Menu data to save
   * @returns {Object} Save result
   */
  async saveMenu(userId, menuData) {
    try {
      const { name, description, total_nutrition, items, generation_parameters } = menuData;

      // Create menu using the model
      const result = await SavedMenu.create(userId, {
        name,
        description,
        total_nutrition,
        items,
        generation_parameters
      });

      logger.info(`Menu saved successfully for user: ${userId}, menu ID: ${result.menuId}`);

      return {
        success: true,
        message: MESSAGES.SUCCESS.MENU_SAVED,
        menuId: result.menuId,
        createdAt: result.createdAt
      };
    } catch (error) {
      logger.error('Error saving menu:', error);
      throw error;
    }
  }

  /**
   * Delete a saved menu
   * @param {string} userId - User ID
   * @param {string} menuId - Menu ID to delete
   * @returns {Object} Delete result
   */
  async deleteSavedMenu(userId, menuId) {
    try {
      // Check if menu exists and belongs to user
      const menuExists = await SavedMenu.existsForUser(menuId, userId);
      
      if (!menuExists) {
        const error = new Error(MESSAGES.ERROR.MENU_NOT_FOUND);
        error.status = 404;
        throw error;
      }

      // Delete menu using the model
      await SavedMenu.deleteByIdAndUser(menuId, userId);

      logger.info(`Menu deleted successfully for user: ${userId}, menu ID: ${menuId}`);

      return {
        success: true,
        message: MESSAGES.SUCCESS.MENU_DELETED
      };
    } catch (error) {
      logger.error('Error deleting saved menu:', error);
      throw error;
    }
  }
}

module.exports = new NutritionMenuService();