import api from './api';

const cartService = {
  // Add item to cart
  async addToCart(productId, quantity = 1) {
    try {
      console.log('Frontend cartService.addToCart called with:', { productId, quantity, productIdType: typeof productId });
      const requestData = {
        productId,
        quantity
      };
      console.log('Sending to backend:', requestData);
      const response = await api.post('/cart/add', requestData);
      console.log('Backend response:', response.data);
      return response.data;
    } catch (error) {
      console.error('addToCart error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  // Remove item from cart
  async removeFromCart(productId) {
    try {
      const response = await api.delete(`/cart/remove/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update item quantity
  async updateQuantity(productId, quantity) {
    try {
      const response = await api.put(`/cart/update/${productId}`, {
        quantity
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get cart details
  async getCart() {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Clear entire cart
  async clearCart() {
    try {
      const response = await api.delete('/cart/clear');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Compare prices for cart items
  async comparePrices() {
    try {
      console.log('Frontend cartService.comparePrices called');
      const response = await api.get('/cart/compare-prices');
      console.log('Price comparison response from backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('comparePrices error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  }
};

export default cartService; 