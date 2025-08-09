import { useState, useEffect } from 'react';
import { nutritionService } from '../services/nutritionService';

export const useDashboard = () => {
  const [nutritionHistory, setNutritionHistory] = useState([]);
  const [todayStats, setTodayStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from the API
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const [todayResponse, historyResponse] = await Promise.all([
        nutritionService.getNutritionHistory({
          startDate: today,
          endDate: today
        }),
        nutritionService.getNutritionHistory({
          startDate: thirtyDaysAgo,
          endDate: today
        })
      ]);
      
      // Process today's stats
      let todayStats = {
        dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      };
      
      if (todayResponse.logs && todayResponse.logs.length > 0) {
        const todayLog = todayResponse.logs[0];
        todayStats = {
          dailyTotals: {
            calories: Number(todayLog.total_calories) || 0,
            protein: parseFloat(todayLog.total_protein) || 0,
            carbs: parseFloat(todayLog.total_carbs) || 0,
            fat: parseFloat(todayLog.total_fat) || 0
          }
        };
      }
      
      // Process nutrition history
      const nutritionHistory = historyResponse.logs ? historyResponse.logs.map(log => ({
        _id: log.id,
        date: log.log_date,
        dailyTotals: {
          calories: Number(log.total_calories) || 0,
          protein: parseFloat(log.total_protein) || 0,
          carbs: parseFloat(log.total_carbs) || 0,
          fat: parseFloat(log.total_fat) || 0
        },
        meals: [] // meals data structure not available in current API response
      })) : [];
      
      setTodayStats(todayStats);
      setNutritionHistory(nutritionHistory);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setTodayStats({
        dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      });
      setNutritionHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = () => {
    fetchDashboardData();
  };

  return {
    nutritionHistory,
    todayStats,
    loading,
    refreshDashboard
  };
}; 