/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import apiClient, { handleApiResponse, handleApiError } from './apiClient';
import { API_ENDPOINTS, STORAGE_KEYS } from '../../constants/api';

class AuthService {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and token
   */
  async login(email, password) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      const data = handleApiResponse(response);
      
      // Store token and user data
      if (data.token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      }
      if (data.user) {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      handleApiError(error);
    }
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration response
   */
  async register(userData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  }

  /**
   * Refresh authentication token
   * @returns {Promise<Object>} New token and user data
   */
  async refreshToken() {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN);
      const data = handleApiResponse(response);
      
      if (data.token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      }
      if (data.user) {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      // If refresh fails, clear stored data
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      handleApiError(error);
    }
  }

  /**
   * Validate current token
   * @returns {Promise<Object>} User data
   */
  async validateToken() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.VALIDATE_TOKEN);
      const data = handleApiResponse(response);
      
      if (data.user) {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      // If validation fails, clear stored data
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      handleApiError(error);
    }
  }

  /**
   * Get current user from local storage
   * @returns {Object|null} Current user data
   */
  getCurrentUser() {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  }

  /**
   * Get current auth token from local storage
   * @returns {string|null} Current auth token
   */
  getCurrentToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user has valid token
   */
  isAuthenticated() {
    return !!this.getCurrentToken();
  }
}

// Export singleton instance
export default new AuthService();