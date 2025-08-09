import api from './api';
import { DEFAULT_NUTRITION_GOALS } from '../constants/presets';

class UserService {
  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }

  // Update user nutrition profile including macro goals
  async updateNutritionProfile(userId, profileData) {
    try {
      const response = await api.put(`/users/${userId}/nutrition-profile`, profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating nutrition profile:', error);
      throw error;
    }
  }

  // Get user nutrition goals (from macro_goals in nutrition profile)
  async getNutritionGoals(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      const user = response.data.user || response.data;
      
      if (user.nutrition_profile && user.nutrition_profile.macro_goals) {
        return user.nutrition_profile.macro_goals;
      }
      // Return default goals if none are set
      return DEFAULT_NUTRITION_GOALS;
    } catch (error) {
      console.error('Error fetching nutrition goals:', error);
      // Return default goals on error
      return DEFAULT_NUTRITION_GOALS;
    }
  }

  // Update user nutrition goals
  async updateNutritionGoals(userId, goals) {
    try {
      // Only send the macro goals and daily calorie goal, nothing else
      const profileUpdate = {
        macro_goals: goals,
        daily_calorie_goal: goals.calories
      };

      const response = await this.updateNutritionProfile(userId, profileUpdate);
      return response;
    } catch (error) {
      console.error('Error updating nutrition goals:', error);
      throw error;
    }
  }

  // Update basic user profile
  async updateProfile(userId, profileData) {
    try {
      const response = await api.put(`/users/${userId}`, profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService; 