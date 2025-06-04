import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(userData) {
    console.log(userData);
    const response = await api.post('/users/register', userData);
    return response.data;
  },

  async validateToken() {
    const response = await api.get('/auth/validate');
    return response.data.user;
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh');
    // Update token if a new one is provided
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data.user;
  },

  async logout() {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  }
};