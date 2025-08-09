// Nutrition analysis and trends service
const NutritionLog = require('../models/NutritionLogPostgres');
const User = require('../models/UserPostgres');
const PythonService = require('./pythonService');
const NutritionUtils = require('../utils/nutritionUtils');
const DateUtils = require('../utils/dateUtils');
const { TIME_CONSTANTS } = require('../constants/nutrition');
const { MESSAGES } = require('../constants/api');
const logger = require('../utils/logger');

class NutritionAnalysisService {
  /**
   * Get personalized recommendations
   * @param {string} userId - User ID
   * @returns {Object} Recommendations
   */
  async getRecommendations(userId) {
    try {
      // Get user profile
      const user = await User.findById(userId);
      if (!user) {
        const error = new Error(MESSAGES.ERROR.USER_NOT_FOUND);
        error.status = 404;
        throw error;
      }

      // Get recent nutrition logs (last 7 days)
      const { startDate, endDate } = DateUtils.getDateRangeForPeriod(TIME_CONSTANTS.RECENT_LOGS_DAYS);
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

      return {
        message: MESSAGES.SUCCESS.RECOMMENDATIONS_GENERATED,
        recommendations
      };
    } catch (error) {
      logger.error('Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Analyze nutrition trends
   * @param {string} userId - User ID
   * @param {string} period - Period in days (default: 30)
   * @returns {Object} Trend analysis
   */
  async analyzeTrends(userId, period = '30') {
    try {
      const periodDays = parseInt(period);
      const { startDate, endDate } = DateUtils.getDateRangeForPeriod(periodDays);

      // Get logs and summary
      const nutritionLogs = await NutritionLog.getUserLogs(userId, startDate, endDate, 100);
      const summary = await NutritionLog.getSummary(userId, startDate, endDate);

      // Calculate trends using utility methods
      const weeklyData = NutritionUtils.groupLogsByWeek(nutritionLogs);
      const weeklyTrends = NutritionUtils.calculateWeeklyTrends(weeklyData);
      const goalProgress = await this.calculateGoalProgress(userId, summary);

      const trends = {
        period_days: periodDays,
        total_logs: nutritionLogs.length,
        average_daily: summary,
        weekly_trends: weeklyTrends,
        goal_progress: goalProgress
      };

      logger.info(`Trends analyzed for user: ${userId}`);

      return {
        message: MESSAGES.SUCCESS.TRENDS_ANALYZED,
        trends
      };
    } catch (error) {
      logger.error('Error analyzing trends:', error);
      throw error;
    }
  }

  /**
   * Calculate goal progress
   * @param {string} userId - User ID
   * @param {Object} summary - Nutrition summary
   * @returns {Object|null} Goal progress
   */
  async calculateGoalProgress(userId, summary) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.nutrition_profile) {
        return null;
      }

      return NutritionUtils.calculateGoalProgress(summary, user.nutrition_profile);
    } catch (error) {
      logger.error('Error calculating goal progress:', error);
      return null;
    }
  }
}

module.exports = new NutritionAnalysisService();