const NutritionLog = require('../models/NutritionLogPostgres');
const PythonService = require('../services/pythonService');
const User = require('../models/UserPostgres');
const SavedMenu = require('../models/SavedMenuPostgres');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class NutritionController {
  // Calculate nutrition based on user data
  async calculateNutrition(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }
  
      // Handle case where authentication is disabled
      const userId = req.user?.userId || null;
      
      // ✅ Format data EXACTLY as Python expects
      const nutritionData = {
        calories: parseFloat(req.body.calories),
        protein: parseFloat(req.body.protein), 
        carbs: parseFloat(req.body.carbs),
        fat: parseFloat(req.body.fat),
        meal_template: req.body.meal_template || null,
        subcategories: req.body.subcategories || null,
        num_items: req.body.num_items ? parseInt(req.body.num_items) : null,
        include_prices: req.body.include_prices === true || req.body.include_prices === 'true',
        requiredProducts: req.body.requiredProducts || null
      };
  
      // Remove null values
      Object.keys(nutritionData).forEach(key => {
        if (nutritionData[key] === null || nutritionData[key] === undefined) {
          delete nutritionData[key];
        }
      });
  
      logger.info('Sending to Python:', nutritionData);
  
      // Send to Python server
      const calculationResult = await PythonService.calculateNutrition(nutritionData);
      console.log(calculationResult)
  
      res.status(200).json({
        message: 'Nutrition calculated successfully',
        data: calculationResult
      });
    } catch (error) {
      next(error);
    }
  }

  // Log daily nutrition
  async logNutrition(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const userId = req.user.userId;
      const { date, meals, waterIntake } = req.body;

      const logDate = date ? date : new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD

      // Check if log already exists for this date (PostgreSQL method)
      let nutritionLog = await NutritionLog.findByUserAndDate(userId, logDate);

      if (!nutritionLog) {
        // Create new log
        nutritionLog = await NutritionLog.create(userId, logDate);
      }

      // Calculate daily totals
      let dailyTotals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };

      // Add meals to the log
      for (const meal of meals) {
        const items = meal.foods.map(food => ({
          product_id: food.product_id || null,
          custom_food_name: food.name,
          quantity: parseFloat(food.quantity) || 100,
          unit: food.unit || 'grams',
          calories: parseFloat(food.calories) || 0,
          protein: parseFloat(food.macros?.protein) || 0,
          carbs: parseFloat(food.macros?.carbs) || 0,
          fat: parseFloat(food.macros?.fat) || 0
        }));

        await nutritionLog.addMeal(meal.type, items);

        // Update daily totals
        items.forEach(item => {
          dailyTotals.calories += item.calories || 0;
          dailyTotals.protein += item.protein || 0;
          dailyTotals.carbs += item.carbs || 0;
          dailyTotals.fat += item.fat || 0;
        });
      }

      // Update water intake if provided
      if (waterIntake !== undefined) {
        await nutritionLog.updateWaterIntake(waterIntake);
      }

      logger.info(`Nutrition logged for user: ${userId}, date: ${logDate}`);

      res.status(200).json({
        message: 'Nutrition logged successfully',
        log: nutritionLog.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Get nutrition history
  async getNutritionHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const { startDate, endDate, limit = 30 } = req.query;

      // Set default date range if not provided
      const endDateFormatted = endDate || new Date().toISOString().split('T')[0];
      const startDateFormatted = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get logs using PostgreSQL method
      const nutritionLogs = await NutritionLog.getUserLogs(
        userId, 
        startDateFormatted, 
        endDateFormatted, 
        parseInt(limit)
      );

      res.status(200).json({
        logs: nutritionLogs.map(log => log.toJSON()),
        count: nutritionLogs.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Get nutrition recommendations from Python server
  async getRecommendations(req, res, next) {
    try {
      const userId = req.user.userId;

      // Get user profile using PostgreSQL method
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get recent nutrition logs (last 7 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const recentLogs = await NutritionLog.getUserLogs(userId, startDate, endDate, 7);

      // Prepare data for Python server
      const recommendationData = {
        userId,
        userProfile: user.nutrition_profile,
        recentNutritionData: recentLogs.map(log => log.toJSON())
      };

      // Get recommendations from Python server
      const recommendations = await PythonService.getRecommendations(recommendationData);

      logger.info(`Recommendations generated for user: ${userId}`);

      res.status(200).json({
        message: 'Recommendations generated successfully',
        recommendations
      });
    } catch (error) {
      if (error.code === 'PYTHON_SERVER_ERROR') {
        return res.status(503).json({ 
          error: 'Recommendation service temporarily unavailable' 
        });
      }
      next(error);
    }
  }

  // Analyze nutrition trends
  async analyzeTrends(req, res, next) {
    try {
      const userId = req.user.userId;
      const { period = '30' } = req.query; // days

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get logs and summary using PostgreSQL methods
      const nutritionLogs = await NutritionLog.getUserLogs(userId, startDate, endDate, 100);
      const summary = await NutritionLog.getSummary(userId, startDate, endDate);

      // Calculate trends
      const trends = {
        period_days: parseInt(period),
        total_logs: nutritionLogs.length,
        average_daily: summary,
        weekly_trends: this.calculateWeeklyTrends(nutritionLogs),
        goal_progress: await this.calculateGoalProgress(userId, summary)
      };

      logger.info(`Trends analyzed for user: ${userId}`);

      res.status(200).json({
        message: 'Trends analyzed successfully',
        trends
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper method to calculate weekly trends
  calculateWeeklyTrends(logs) {
    const weeklyData = {};
    
    logs.forEach(log => {
      const week = this.getWeekKey(log.log_date);
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

    // Calculate averages for each week
    const trends = Object.keys(weeklyData).map(week => ({
      week,
      avg_calories: this.calculateAverage(weeklyData[week].calories),
      avg_protein: this.calculateAverage(weeklyData[week].protein),
      avg_carbs: this.calculateAverage(weeklyData[week].carbs),
      avg_fat: this.calculateAverage(weeklyData[week].fat)
    }));

    return trends.sort((a, b) => a.week.localeCompare(b.week));
  }

  // Helper method to get week key
  getWeekKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const week = Math.ceil((d.getDate() + new Date(year, d.getMonth(), 1).getDay()) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  // Helper method to calculate average
  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 100) / 100;
  }

  // Get food categories and subcategories from Python server
  async getFoodCategories(req, res, next) {
    try {
      // Get food categories from Python server
      const categories = await PythonService.getFoodCategories();

      logger.info('Food categories retrieved successfully');

      res.status(200).json({
        message: 'Food categories retrieved successfully',
        ...categories
      });
    } catch (error) {
      if (error.code === 'PYTHON_SERVER_ERROR') {
        return res.status(503).json({ 
          error: 'Food category service temporarily unavailable' 
        });
      }
      next(error);
    }
  }

  // Calculate goal progress helper method
  async calculateGoalProgress(userId, summary) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.nutrition_profile) {
        return null;
      }

      const goals = user.nutrition_profile;
      return {
        calories: {
          current: summary.total_calories,
          goal: goals.daily_calories,
          percentage: (summary.total_calories / goals.daily_calories) * 100
        },
        protein: {
          current: summary.total_protein,
          goal: goals.protein_goal,
          percentage: (summary.total_protein / goals.protein_goal) * 100
        },
        carbs: {
          current: summary.total_carbs,
          goal: goals.carbs_goal,
          percentage: (summary.total_carbs / goals.carbs_goal) * 100
        },
        fat: {
          current: summary.total_fat,
          goal: goals.fat_goal,
          percentage: (summary.total_fat / goals.fat_goal) * 100
        }
      };
    } catch (error) {
      logger.error('Error calculating goal progress:', error);
      return null;
    }
  }

  // Get all saved menus for a user
  async getSavedMenus(req, res, next) {
    try {
      const userId = req.user.userId;

      // Get saved menus using the model
      const savedMenusData = await SavedMenu.getUserMenus(userId);
      
      // Format the response to match the frontend expectations
      const savedMenus = savedMenusData.map(menu => menu.toJSON());

      logger.info(`Retrieved ${savedMenus.length} saved menus for user: ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Saved menus retrieved successfully',
        savedMenus,
        count: savedMenus.length
      });
    } catch (error) {
      logger.error('Error getting saved menus:', error);
      next(error);
    }
  }

  // Save a new menu
  async saveMenu(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const userId = req.user.userId;
      const { name, description, total_nutrition, items, generation_parameters } = req.body;

      // Create menu using the model
      const result = await SavedMenu.create(userId, {
        name,
        description,
        total_nutrition,
        items,
        generation_parameters
      });

      logger.info(`Menu saved successfully for user: ${userId}, menu ID: ${result.menuId}`);

      res.status(201).json({
        success: true,
        message: 'Menu saved successfully',
        menuId: result.menuId,
        createdAt: result.createdAt
      });
    } catch (error) {
      logger.error('Error saving menu:', error);
      next(error);
    }
  }

  // Delete a saved menu
  async deleteSavedMenu(req, res, next) {
    try {
      const userId = req.user.userId;
      const menuId = req.params.id;

      // Check if menu exists and belongs to user
      const menuExists = await SavedMenu.existsForUser(menuId, userId);
      
      if (!menuExists) {
        return res.status(404).json({
          success: false,
          error: 'Menu not found or not owned by user'
        });
      }

      // Delete menu using the model
      await SavedMenu.deleteByIdAndUser(menuId, userId);

      logger.info(`Menu deleted successfully for user: ${userId}, menu ID: ${menuId}`);

      res.status(200).json({
        success: true,
        message: 'Menu deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting saved menu:', error);
      next(error);
    }
  }
}

module.exports = new NutritionController();