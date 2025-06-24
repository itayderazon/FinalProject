import api from './api';

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
      console.log('🔍 UserService: Fetching nutrition goals for user:', userId);
      const response = await api.get(`/users/${userId}`);
      const user = response.data.user || response.data;
      
      console.log('👤 UserService: User data received:', {
        hasNutritionProfile: !!user.nutrition_profile,
        nutritionProfile: user.nutrition_profile
      });
      
      if (user.nutrition_profile && user.nutrition_profile.macro_goals) {
        console.log('✅ UserService: Found macro goals:', user.nutrition_profile.macro_goals);
        return user.nutrition_profile.macro_goals;
      }
      
      console.log('⚠️ UserService: No macro goals found, returning defaults');
      // Return default goals if none are set
      return {
        calories: 2000,
        protein: 140,
        carbs: 250,
        fat: 70
      };
    } catch (error) {
      console.error('Error fetching nutrition goals:', error);
      // Return default goals on error
      return {
        calories: 2000,
        protein: 140,
        carbs: 250,
        fat: 70
      };
    }
  }

  // Update user nutrition goals
  async updateNutritionGoals(userId, goals) {
    try {
      // First get the current nutrition profile
      const currentUser = await api.get(`/users/${userId}`);
      const user = currentUser.data.user || currentUser.data;
      
      // Prepare the profile update with the new macro goals
      const profileUpdate = {
        ...user.nutrition_profile,
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