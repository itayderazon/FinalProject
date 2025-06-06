const NutritionLog = require('../models/NutritionLogPostgres');
const PythonService = require('../services/pythonService');
const User = require('../models/UserPostgres');
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
        meal_type: req.body.meal_type || null,
        num_items: req.body.num_items ? parseInt(req.body.num_items) : null,
        include_prices: req.body.include_prices === true || req.body.include_prices === 'true'
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
          quantity: food.quantity || 100,
          unit: food.unit || 'grams',
          calories: food.calories,
          protein: food.macros?.protein || 0,
          carbs: food.macros?.carbs || 0,
          fat: food.macros?.fat || 0
        }));

        await nutritionLog.addMeal(meal.type, items);

        // Update daily totals
        items.forEach(item => {
          dailyTotals.calories += item.calories;
          dailyTotals.protein += item.protein;
          dailyTotals.carbs += item.carbs;
          dailyTotals.fat += item.fat;
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

  // Helper method to calculate goal progress
  async calculateGoalProgress(userId, summary) {
    try {
      const user = await User.findById(userId);
      if (!user?.nutrition_profile?.daily_calorie_goal) {
        return null;
      }

      const goal = user.nutrition_profile.daily_calorie_goal;
      const actual = summary.avg_calories;
      const progress = Math.round((actual / goal) * 100);

      return {
        daily_calorie_goal: goal,
        avg_daily_calories: actual,
        goal_achievement_percentage: progress,
        status: progress >= 90 && progress <= 110 ? 'on_track' : 
               progress < 90 ? 'under_target' : 'over_target'
      };
    } catch (error) {
      logger.error('Error calculating goal progress:', error);
      return null;
    }
  }
}

module.exports = new NutritionController();