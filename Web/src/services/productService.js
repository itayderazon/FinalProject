import api from './api';

const productService = {
  // Get all products with filtering and pagination
  async getProducts(params = {}) {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get product by ID
  async getProductById(id) {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search products
  async searchProducts(query, filters = {}) {
    try {
      const params = { q: query, ...filters };
      const response = await api.get('/products/search', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get categories
  async getCategories() {
    try {
      const response = await api.get('/products/categories');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get brands
  async getBrands(category = null) {
    try {
      const params = category ? { category } : {};
      const response = await api.get('/products/brands', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get supermarkets
  async getSupermarkets() {
    try {
      const response = await api.get('/products/supermarkets');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get best deals
  async getBestDeals(limit = 20) {
    try {
      const response = await api.get('/products/deals', { params: { limit } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Compare prices for multiple products
  async comparePrices(productIds) {
    try {
      const response = await api.post('/products/compare', { productIds });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get catalog statistics
  async getCatalogStats() {
    try {
      const response = await api.get('/products/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get healthy products with nutrition filters
  async getHealthyProducts(criteria = {}) {
    try {
      const params = {
        maxCalories: criteria.lowCalorie ? 100 : undefined,
        minProtein: criteria.highProtein ? 15 : undefined,
        allergens: criteria.allergens || []
      };
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default productService; 