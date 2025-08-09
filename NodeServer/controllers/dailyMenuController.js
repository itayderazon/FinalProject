const DailyMenu = require('../models/DailyMenuPostgres');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class DailyMenuController {
  // Create a new daily menu
  async createDailyMenu(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const userId = req.user.userId;
      const { menu_date, name, description, is_template } = req.body;

      const menuData = {
        menu_date,
        name,
        description,
        is_template: is_template || false
      };

      const dailyMenu = await DailyMenu.create(userId, menuData);

      logger.info(`Daily menu created for user: ${userId}, date: ${menu_date}`);

      res.status(201).json({
        message: 'Daily menu created successfully',
        daily_menu: dailyMenu.toJSON()
      });
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ 
          error: 'A menu with this name already exists for this date' 
        });
      }
      next(error);
    }
  }

  // Get user's daily menus
  async getUserDailyMenus(req, res, next) {
    try {
      const userId = req.user.userId;
      const { 
        startDate, 
        endDate, 
        includeTemplates = false, 
        limit = 50, 
        offset = 0 
      } = req.query;

      // Set default date range if not provided
      const endDateFormatted = endDate || new Date().toISOString().split('T')[0];
      const startDateFormatted = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const dailyMenus = await DailyMenu.getUserMenus(
        userId, 
        startDateFormatted, 
        endDateFormatted, 
        includeTemplates === 'true',
        parseInt(limit),
        parseInt(offset)
      );

      res.status(200).json({
        daily_menus: dailyMenus.map(menu => menu.toJSON()),
        count: dailyMenus.length,
        filters: {
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          includeTemplates: includeTemplates === 'true'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's menu templates
  async getUserMenuTemplates(req, res, next) {
    try {
      const userId = req.user.userId;
      const { limit = 20, offset = 0 } = req.query;

      const templates = await DailyMenu.getUserTemplates(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      res.status(200).json({
        templates: templates.map(template => template.toJSON()),
        count: templates.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Get detailed daily menu by ID
  async getDailyMenuById(req, res, next) {
    try {
      const { menuId } = req.params;
      const userId = req.user.userId;

      const dailyMenu = await DailyMenu.findById(menuId);
      
      if (!dailyMenu) {
        return res.status(404).json({ error: 'Daily menu not found' });
      }

      // Check if user owns this menu
      if (dailyMenu.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const detailedMenu = await dailyMenu.getDetailedMenu();

      res.status(200).json({
        daily_menu: detailedMenu
      });
    } catch (error) {
      next(error);
    }
  }

  // Get daily menu for specific date
  async getDailyMenuByDate(req, res, next) {
    try {
      const userId = req.user.userId;
      const { date } = req.params;
      const { menuName } = req.query;

      const dailyMenu = await DailyMenu.findByUserAndDate(userId, date, menuName);
      
      if (!dailyMenu) {
        return res.status(200).json({ 
          daily_menu: null,
          date: date 
        });
      }

      const detailedMenu = await dailyMenu.getDetailedMenu();

      res.status(200).json({
        daily_menu: detailedMenu
      });
    } catch (error) {
      next(error);
    }
  }

  // Update daily menu
  async updateDailyMenu(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { menuId } = req.params;
      const userId = req.user.userId;
      const updateData = req.body;

      const dailyMenu = await DailyMenu.findById(menuId);
      
      if (!dailyMenu) {
        return res.status(404).json({ error: 'Daily menu not found' });
      }

      // Check if user owns this menu
      if (dailyMenu.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedMenu = await dailyMenu.update(updateData);

      logger.info(`Daily menu updated: ${menuId} by user: ${userId}`);

      res.status(200).json({
        message: 'Daily menu updated successfully',
        daily_menu: updatedMenu.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete daily menu
  async deleteDailyMenu(req, res, next) {
    try {
      const { menuId } = req.params;
      const userId = req.user.userId;

      const dailyMenu = await DailyMenu.findById(menuId);
      
      if (!dailyMenu) {
        return res.status(404).json({ error: 'Daily menu not found' });
      }

      // Check if user owns this menu
      if (dailyMenu.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await dailyMenu.delete();

      logger.info(`Daily menu deleted: ${menuId} by user: ${userId}`);

      res.status(200).json({
        message: 'Daily menu deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Add meal to daily menu
  async addMealToDailyMenu(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { menuId } = req.params;
      const userId = req.user.userId;
      const { meal_type, meal_order, name, description, target_nutrition, items } = req.body;

      // Process and validate items to ensure nutrition data is properly formatted
      const processedItems = (items || []).map(item => {
        const processedItem = {
          product_id: item.product_id || null,
          custom_food_name: item.custom_food_name || null,
          quantity: parseFloat(item.quantity) || 0,
          unit: item.unit || 'grams',
          source_type: item.source_type || 'manual',
          source_menu_id: item.source_menu_id || null
        };
        
        // Only include nutrition data if no product_id (custom foods)
        // For products, let addMeal function fetch nutrition from products table
        if (!item.product_id) {
          processedItem.calories = parseFloat(item.calories) || 0;
          processedItem.protein = parseFloat(item.protein) || 0;
          processedItem.carbs = parseFloat(item.carbs) || 0;
          processedItem.fat = parseFloat(item.fat) || 0;
        }
        
        return processedItem;
      });

      const dailyMenu = await DailyMenu.findById(menuId);
      
      if (!dailyMenu) {
        return res.status(404).json({ error: 'Daily menu not found' });
      }

      // Check if user owns this menu
      if (dailyMenu.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const mealData = {
        meal_type,
        meal_order: meal_order || 1,
        name,
        description,
        target_calories: target_nutrition?.calories || 0,
        target_protein: target_nutrition?.protein || 0,
        target_carbs: target_nutrition?.carbs || 0,
        target_fat: target_nutrition?.fat || 0
      };

      const meal = await dailyMenu.addMeal(mealData, processedItems);

      logger.info(`Meal added to daily menu: ${menuId} by user: ${userId}`);

      res.status(201).json({
        message: 'Meal added to daily menu successfully',
        meal: meal
      });
    } catch (error) {
      next(error);
    }
  }

  // Add generated menu to daily menu meal slot
  async addGeneratedMenuToDaily(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { menuId } = req.params;
      const userId = req.user.userId;
      const { meal_type, meal_order, generated_menu } = req.body;

      const dailyMenu = await DailyMenu.findById(menuId);
      
      if (!dailyMenu) {
        return res.status(404).json({ error: 'Daily menu not found' });
      }

      // Check if user owns this menu
      if (dailyMenu.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!generated_menu || !generated_menu.items) {
        return res.status(400).json({ error: 'Generated menu data is required' });
      }

      const meal = await dailyMenu.addGeneratedMenuToMeal(
        meal_type, 
        generated_menu, 
        meal_order || 1
      );

      logger.info(`Generated menu added to daily menu: ${menuId} for ${meal_type} by user: ${userId}`);

      res.status(201).json({
        message: 'Generated menu added to daily menu successfully',
        meal: meal
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove meal from daily menu
  async removeMealFromDailyMenu(req, res, next) {
    try {
      const { menuId, mealId } = req.params;
      const userId = req.user.userId;

      const dailyMenu = await DailyMenu.findById(menuId);
      
      if (!dailyMenu) {
        return res.status(404).json({ error: 'Daily menu not found' });
      }

      // Check if user owns this menu
      if (dailyMenu.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const success = await dailyMenu.removeMeal(mealId);

      if (!success) {
        return res.status(404).json({ error: 'Meal not found in this daily menu' });
      }

      logger.info(`Meal removed from daily menu: ${menuId} by user: ${userId}`);

      res.status(200).json({
        message: 'Meal removed from daily menu successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Copy daily menu (create template or duplicate)
  async copyDailyMenu(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { menuId } = req.params;
      const userId = req.user.userId;
      const { new_date, new_name, as_template } = req.body;

      const originalMenu = await DailyMenu.findById(menuId);
      
      if (!originalMenu) {
        return res.status(404).json({ error: 'Daily menu not found' });
      }

      // Check if user owns this menu
      if (originalMenu.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get detailed menu with all meals and items
      const detailedMenu = await originalMenu.getDetailedMenu();

      // Create new menu
      const newMenuData = {
        menu_date: new_date || originalMenu.menu_date,
        name: new_name || `Copy of ${originalMenu.name}`,
        description: originalMenu.description,
        is_template: as_template || false
      };

      const newDailyMenu = await DailyMenu.create(userId, newMenuData);

      // Copy all meals and items
      for (const meal of detailedMenu.meals) {
        const mealData = {
          meal_type: meal.meal_type,
          meal_order: meal.meal_order,
          name: meal.name,
          description: meal.description,
          target_calories: meal.target_nutrition.calories,
          target_protein: meal.target_nutrition.protein,
          target_carbs: meal.target_nutrition.carbs,
          target_fat: meal.target_nutrition.fat
        };

        const items = meal.items.map(item => ({
          product_id: item.product_id,
          custom_food_name: item.custom_food_name,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.nutrition.calories,
          protein: item.nutrition.protein,
          carbs: item.nutrition.carbs,
          fat: item.nutrition.fat,
          source_type: item.source_type,
          source_menu_id: item.source_menu_id
        }));

        await newDailyMenu.addMeal(mealData, items);
      }

      logger.info(`Daily menu copied: ${menuId} to ${newDailyMenu.id} by user: ${userId}`);

      res.status(201).json({
        message: 'Daily menu copied successfully',
        daily_menu: newDailyMenu.toJSON()
      });
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ 
          error: 'A menu with this name already exists for this date' 
        });
      }
      next(error);
    }
  }

  // Get nutrition summary for date range
  async getNutritionSummary(req, res, next) {
    try {
      const userId = req.user.userId;
      const { startDate, endDate } = req.query;

      // Set default date range if not provided
      const endDateFormatted = endDate || new Date().toISOString().split('T')[0];
      const startDateFormatted = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const dailyMenus = await DailyMenu.getUserMenus(
        userId, 
        startDateFormatted, 
        endDateFormatted,
        false, // Don't include templates
        100,   // High limit to get all menus in range
        0
      );

      // Calculate summary statistics
      let totalDays = 0;
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      const dailyBreakdown = [];

      for (const menu of dailyMenus) {
        totalDays++;
        totalCalories += menu.total_calories;
        totalProtein += menu.total_protein;
        totalCarbs += menu.total_carbs;
        totalFat += menu.total_fat;

        dailyBreakdown.push({
          date: menu.menu_date,
          name: menu.name,
          calories: menu.total_calories,
          protein: menu.total_protein,
          carbs: menu.total_carbs,
          fat: menu.total_fat
        });
      }

      const averages = totalDays > 0 ? {
        calories: Math.round(totalCalories / totalDays),
        protein: Math.round((totalProtein / totalDays) * 100) / 100,
        carbs: Math.round((totalCarbs / totalDays) * 100) / 100,
        fat: Math.round((totalFat / totalDays) * 100) / 100
      } : { calories: 0, protein: 0, carbs: 0, fat: 0 };

      res.status(200).json({
        summary: {
          period: {
            start: startDateFormatted,
            end: endDateFormatted,
            days: totalDays
          },
          totals: {
            calories: totalCalories,
            protein: Math.round(totalProtein * 100) / 100,
            carbs: Math.round(totalCarbs * 100) / 100,
            fat: Math.round(totalFat * 100) / 100
          },
          averages,
          daily_breakdown: dailyBreakdown
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DailyMenuController(); 