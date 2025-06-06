import api from './api';

const PYTHON_API_URL =  'http://localhost:3000/api';

export const nutritionService = {
  async generateMenu(nutritionData) {

    const response = await api.post('/nutrition/calculate', nutritionData);
    return response.data;
  },

  async getRecommendations() {
    const response = await api.get('/nutrition/recommendations');
    return response.data;
  },

  async logNutrition(nutritionData) {
    const response = await api.post('/nutrition/log', nutritionData);
    return response.data;
  },

  async getNutritionHistory(params = {}) {
    const response = await api.get('/nutrition/history', { params });
    return response.data;
  },

  // Price comparison methods
  async comparePrices(menuItems) {
    const response = await api.post('/price/compare', { menu_items: menuItems });
    return response.data;
  },

  async getCheapestCombination(menuItems) {
    const response = await api.post('/price/cheapest-combination', { menu_items: menuItems });
    return response.data;
  },

  async getAvailableSupermarkets() {
    const response = await api.get('/price/supermarkets');
    return response.data;
  }
};