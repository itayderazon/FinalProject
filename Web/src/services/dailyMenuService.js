import api from './api';

class DailyMenuService {
  // Helper method for API calls
  async apiCall(endpoint, options = {}) {
    try {
      const method = options.method || 'GET';
      const url = `/daily-menus${endpoint}`;
      
      let response;
      if (method === 'GET') {
        response = await api.get(url);
      } else if (method === 'POST') {
        response = await api.post(url, JSON.parse(options.body || '{}'));
      } else if (method === 'PUT') {
        response = await api.put(url, JSON.parse(options.body || '{}'));
      } else if (method === 'DELETE') {
        response = await api.delete(url);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Create a new daily menu
  async createDailyMenu(menuData) {
    return this.apiCall('', {
      method: 'POST',
      body: JSON.stringify(menuData),
    });
  }

  // Get user's daily menus
  async getUserDailyMenus(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.includeTemplates) queryParams.append('includeTemplates', params.includeTemplates);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);

    const endpoint = queryParams.toString() ? `?${queryParams}` : '';
    return this.apiCall(endpoint);
  }

  // Get user's menu templates
  async getUserMenuTemplates(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);

    const endpoint = `/templates${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.apiCall(endpoint);
  }

  // Get daily menu by ID
  async getDailyMenuById(menuId) {
    return this.apiCall(`/${menuId}`);
  }

  // Get daily menu by date
  async getDailyMenuByDate(date, menuName = null) {
    const queryParams = menuName ? `?menuName=${encodeURIComponent(menuName)}` : '';
    return this.apiCall(`/date/${date}${queryParams}`);
  }

  // Update daily menu
  async updateDailyMenu(menuId, updateData) {
    return this.apiCall(`/${menuId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete daily menu
  async deleteDailyMenu(menuId) {
    return this.apiCall(`/${menuId}`, {
      method: 'DELETE',
    });
  }

  // Add meal to daily menu
  async addMealToDailyMenu(menuId, mealData) {
    return this.apiCall(`/${menuId}/meals`, {
      method: 'POST',
      body: JSON.stringify(mealData),
    });
  }

  // Add generated menu to daily menu
  async addGeneratedMenuToDaily(menuId, data) {
    return this.apiCall(`/${menuId}/meals/generated`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Remove meal from daily menu
  async removeMealFromDailyMenu(menuId, mealId) {
    return this.apiCall(`/${menuId}/meals/${mealId}`, {
      method: 'DELETE',
    });
  }

  // Copy daily menu
  async copyDailyMenu(menuId, copyData) {
    return this.apiCall(`/${menuId}/copy`, {
      method: 'POST',
      body: JSON.stringify(copyData),
    });
  }

  // Get nutrition summary
  async getNutritionSummary(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const endpoint = `/nutrition-summary${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.apiCall(endpoint);
  }

  // Helper methods for date formatting
  formatDateForAPI(date) {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0];
  }

  // Helper to create a daily menu from a template
  async createFromTemplate(templateId, targetDate, customName = null) {
    try {
      const template = await this.getDailyMenuById(templateId);
      
      if (!template.daily_menu) {
        throw new Error('Template not found');
      }

      const menuData = {
        menu_date: this.formatDateForAPI(targetDate),
        name: customName || `${template.daily_menu.name} - ${this.formatDateForAPI(targetDate)}`,
        description: template.daily_menu.description,
        is_template: false
      };

      // Create the new menu
      const newMenu = await this.createDailyMenu(menuData);

      // Copy all meals from template
      if (template.daily_menu.meals && template.daily_menu.meals.length > 0) {
        for (const meal of template.daily_menu.meals) {
          const mealData = {
            meal_type: meal.meal_type,
            meal_order: meal.meal_order,
            name: meal.name,
            description: meal.description,
            target_nutrition: meal.target_nutrition,
            items: meal.items.map(item => ({
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
            }))
          };

          await this.addMealToDailyMenu(newMenu.daily_menu.id, mealData);
        }
      }

      return newMenu;
    } catch (error) {
      console.error('Error creating menu from template:', error);
      throw error;
    }
  }

  // Helper to get current week's menus
  async getCurrentWeekMenus() {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

    return this.getUserDailyMenus({
      startDate: this.formatDateForAPI(startOfWeek),
      endDate: this.formatDateForAPI(endOfWeek),
      includeTemplates: false
    });
  }

  // Helper to get today's menu
  async getTodaysMenu() {
    const today = this.formatDateForAPI(new Date());
    try {
      return await this.getDailyMenuByDate(today);
    } catch (error) {
      if (error.message.includes('No menu found')) {
        return null; // No menu for today
      }
      throw error;
    }
  }

  // Helper to calculate weekly nutrition summary
  async getWeeklyNutritionSummary() {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

    return this.getNutritionSummary({
      startDate: this.formatDateForAPI(startOfWeek),
      endDate: this.formatDateForAPI(endOfWeek)
    });
  }

  // Alias for getDailyMenuByDate for consistency
  async getDayMenu(date, menuName = null) {
    try {
      return await this.getDailyMenuByDate(date, menuName);
    } catch (error) {
      if (error.message.includes('No menu found')) {
        return null; // No menu for this date
      }
      throw error;
    }
  }
}

export const dailyMenuService = new DailyMenuService(); 