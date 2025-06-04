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
      
      // In a real app, you would fetch data from your API
      // const [todayStatsResponse, historyResponse] = await Promise.all([
      //   nutritionService.getTodayStats(),
      //   nutritionService.getNutritionHistory()
      // ]);
      
      // Mock data for now
      const mockTodayStats = {
        dailyTotals: { 
          calories: 1850, 
          protein: 120, 
          carbs: 180, 
          fat: 65 
        }
      };
      
      const mockNutritionHistory = [
        { 
          _id: '1', 
          date: new Date().toISOString(), 
          dailyTotals: { calories: 1850 }, 
          meals: ['breakfast', 'lunch'] 
        },
        { 
          _id: '2', 
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), 
          dailyTotals: { calories: 2100 }, 
          meals: ['breakfast', 'lunch', 'dinner'] 
        },
        { 
          _id: '3', 
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
          dailyTotals: { calories: 1750 }, 
          meals: ['breakfast', 'lunch', 'snack'] 
        }
      ];
      
      setTodayStats(mockTodayStats);
      setNutritionHistory(mockNutritionHistory);
      
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